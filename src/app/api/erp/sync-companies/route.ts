import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ERPCompany {
  sodtype: string
  trdr: string
  code: string
  name: string
  afm?: string
  country?: string
  city?: string
  address?: string
  zip?: string
  phone01?: string
  phone02?: string
  fax?: string
  jobtypetrd?: string
  webpage?: string
  email?: string
  emailacc?: string
  irsdata?: string
  upddate?: string
}

// No more encoding conversion needed - handled upstream in fetch-companies API

// No more encoding conversion testing needed

function processEmail(email: string): string | null {
  if (!email) return null
  
  try {
    // If multiple emails, take the first one
    const emails = email.split(/\s+/).filter(e => e.trim())
    const result = emails.length > 0 ? emails[0].trim() : null
    
    console.log(`📧 Email processed: "${email}" → "${result}"`)
    return result
  } catch (error) {
    console.warn('❌ Failed to process email:', error, 'Original email:', email)
    return null
  }
}

function processCompanyData(erpCompany: ERPCompany) {
  console.log(`🏢 Processing company: ${erpCompany.name} (${erpCompany.code})`)
  
  // Helper function to truncate text to database limits
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return text
    return text.length > maxLength ? text.substring(0, maxLength) : text
  }
  
  const processedData = {
    sodtype: parseInt(erpCompany.sodtype),
    trdr: erpCompany.trdr ? parseInt(erpCompany.trdr) : undefined,
    code: truncateText(erpCompany.code, 64),
    name: truncateText(erpCompany.name, 255),
    afm: erpCompany.afm ? truncateText(erpCompany.afm, 20) : "",
    country: erpCompany.country ? truncateText(erpCompany.country, 10) : undefined,
    address: erpCompany.address ? truncateText(erpCompany.address, 255) : undefined,
    zip: erpCompany.zip ? truncateText(erpCompany.zip, 10) : undefined,
    city: erpCompany.city ? truncateText(erpCompany.city, 100) : undefined,
    phone01: erpCompany.phone01 ? truncateText(erpCompany.phone01, 30) : undefined,
    phone02: erpCompany.phone02 ? truncateText(erpCompany.phone02, 30) : undefined,
    fax: erpCompany.fax ? truncateText(erpCompany.fax, 30) : undefined,
    jobtypetrd: erpCompany.jobtypetrd ? parseInt(erpCompany.jobtypetrd) || undefined : undefined,
    webpage: erpCompany.webpage ? truncateText(erpCompany.webpage, 255) : undefined,
    email: erpCompany.email ? processEmail(erpCompany.email) : undefined,
    emailacc: erpCompany.emailacc ? processEmail(erpCompany.emailacc) : undefined,
    irsdata: erpCompany.irsdata ? erpCompany.irsdata : undefined,
    concent: false, // Default value
  }
  
  console.log(`✅ Company processed: ${processedData.name} (${processedData.code})`)
  return processedData
}

export async function POST(request: NextRequest) {
  try {
    // Test database connection first
    console.log('🔍 Testing database connection...')
    try {
      await prisma.$queryRaw`SELECT 1`
      console.log('✅ Database connection successful')
    } catch (dbError) {
      console.error('❌ Database connection failed:', dbError)
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      )
    }
    
    const body = await request.json()
    const { customers, suppliers } = body
    
    if (!customers || !suppliers) {
      return NextResponse.json(
        { success: false, error: 'Missing customers or suppliers data' },
        { status: 400 }
      )
    }

    let totalSynced = 0
    let totalUpdated = 0
    let totalCreated = 0
    let totalErrors = 0

    // Process all companies (customers + suppliers)
    const allCompanies = [...customers, ...suppliers]
    
    console.log(`🔄 Starting sync process for ${allCompanies.length} companies`)
    console.log(`📊 Breakdown: ${customers.length} customers, ${suppliers.length} suppliers`)
    
    for (const erpCompany of allCompanies) {
      try {
        const companyData = processCompanyData(erpCompany)
        
        // Check if company already exists by TRDR or code
        let existingCompany = null
        
        if (companyData.trdr) {
          existingCompany = await prisma.company.findUnique({
            where: { trdr: companyData.trdr }
          })
        }
        
        if (!existingCompany && companyData.code) {
          existingCompany = await prisma.company.findFirst({
            where: { 
              code: companyData.code,
              sodtype: companyData.sodtype
            }
          })
        }

        if (existingCompany) {
          // Check if there are actual changes before updating
          const hasChanges = Object.keys(companyData).some(key => {
            if (key === 'upddate') return false // Skip timestamp comparison
            return existingCompany[key as keyof typeof existingCompany] !== companyData[key as keyof typeof companyData]
          })
          
          if (hasChanges) {
            console.log(`🔄 Updating company: ${companyData.name} (${companyData.code})`)
            try {
              const updatedCompany = await prisma.company.update({
                where: { id: existingCompany.id },
                data: companyData
              })
              console.log(`✅ Company updated successfully: ${updatedCompany.id}`)
              totalUpdated++
            } catch (updateError) {
              console.error(`❌ Failed to update company ${companyData.name}:`, updateError)
              totalErrors++
              continue
            }
          } else {
            console.log(`⏭️ No changes for company: ${companyData.name} (${companyData.code})`)
            totalSynced++ // Count as processed but not updated
          }
        } else {
          // Create new company
          console.log(`➕ Creating new company: ${companyData.name} (${companyData.code})`)
          try {
            const newCompany = await prisma.company.create({
              data: companyData
            })
            console.log(`✅ Company created successfully: ${newCompany.id}`)
            totalCreated++
          } catch (createError) {
            console.error(`❌ Failed to create company ${companyData.name}:`, createError)
            totalErrors++
            continue
          }
        }
        
        totalSynced++
        
      } catch (error) {
        console.error('Error processing company:', erpCompany, error)
        totalErrors++
      }
    }

    // Verify companies were actually saved to database
    console.log('🔍 Verifying database operations...')
    try {
      const totalCompaniesInDB = await prisma.company.count()
      console.log(`📊 Total companies in database: ${totalCompaniesInDB}`)
      
      // Verify recent operations by checking the last few companies
      const recentCompanies = await prisma.company.findMany({
        take: 5,
        orderBy: { id: 'desc' }
      })
      console.log('📋 Recent companies in database:', recentCompanies.map(c => ({ id: c.id, name: c.name, code: c.code })))
      
    } catch (verifyError) {
      console.error('❌ Failed to verify database operations:', verifyError)
    }

    // Cache disabled - skipping cache clear

    console.log(`🎉 Sync completed successfully!`)
    console.log(`📈 Summary: ${totalSynced} processed, ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors`)

    return NextResponse.json({
      success: true,
      message: 'Companies synced successfully',
      summary: {
        totalProcessed: allCompanies.length,
        totalSynced,
        totalCreated,
        totalUpdated,
        totalErrors
      }
    })

  } catch (error) {
    console.error('ERP Sync Companies error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
