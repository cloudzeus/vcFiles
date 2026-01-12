import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        role: role || "EMPLOYEE"
      }
    });

    // Automatically create the user folder in BunnyCDN
    try {
      const apiKey = process.env.BUNNY_ACCESS_KEY;
      const storageZone = process.env.BUNNY_STORAGE_ZONE || 'kolleris';
      
      if (apiKey) {
        const folderPath = `prismafiles/vculture/users/${user.id}`;
        const folderUrl = `https://storage.bunnycdn.com/${storageZone}/${folderPath}/`;
        
        console.log(`Creating user folder: ${folderPath}/`);
        
        const folderResponse = await fetch(folderUrl, {
          method: 'PUT',
          headers: {
            'AccessKey': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({})
        });

        if (folderResponse.ok || folderResponse.status === 409) {
          console.log(`Successfully created user folder: ${folderPath}/`);
          
          // Add a test file to confirm the folder structure
          const testFilePath = `${folderPath}/user-info.txt`;
          const testFileUrl = `https://storage.bunnycdn.com/${storageZone}/${testFilePath}`;
          
          await fetch(testFileUrl, {
            method: 'PUT',
            headers: {
              'AccessKey': apiKey,
              'Content-Type': 'text/plain',
            },
            body: `User: ${user.name || user.email}\nEmail: ${user.email}\nRole: ${user.role}\nCreated: ${new Date().toISOString()}`
          });
        } else {
          console.error(`Failed to create user folder: ${folderPath}`, folderResponse.status);
        }
      }
    } catch (error) {
      console.error('Error creating user folder in BunnyCDN:', error);
      // Don't fail the user creation if folder creation fails
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
