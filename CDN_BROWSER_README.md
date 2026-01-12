# CDN Browser Component

A modern, feature-rich file browser component for BunnyCDN with drag-and-drop support, file management, and a beautiful UI built with Next.js 15, Tailwind CSS, and shadcn/ui.

## Features

- 🗂️ **File & Folder Navigation**: Browse through your CDN storage with intuitive navigation
- 🔒 **Security Restricted**: Access limited to `kolleris/prismafiles/vculture` folder only
- 🔍 **Search & Filter**: Find files quickly with real-time search
- 📱 **Responsive Design**: Works perfectly on desktop and mobile devices
- 🎨 **Modern UI**: Beautiful interface with grid and list view modes
- 🖱️ **Drag & Drop**: Upload files by dragging them directly into the browser
- 📤 **File Upload**: Built-in file upload with progress tracking
- ✨ **Bulk Operations**: Select multiple files for batch actions
- 🔗 **Direct Links**: Copy file URLs and paths to clipboard
- 📊 **File Information**: View file sizes, modification dates, and metadata
- 🚀 **Performance**: Optimized with React hooks and efficient state management

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
# BunnyCDN Configuration
BUNNY_ACCESS_KEY="your-bunnycdn-access-key-here"
BUNNY_STORAGE_ZONE="kolleris"
BUNNY_CDN_URL="https://cdn.bunny.net"
BUNNY_STORAGE_URL="https://kolleris.b-cdn.net"
```

### 2. Get Your BunnyCDN API Key

1. Log in to your BunnyCDN dashboard
2. Go to "Storage" → "FTP & API Access"
3. Copy your API key
4. Add it to your environment variables

### 3. Storage Zone Configuration

Make sure your storage zone is named `prismafiles` or update the `BUNNYCDN_STORAGE_ZONE` environment variable accordingly.

## Usage

### Basic Implementation

```tsx
import CDNBrowser from '@/components/cdn-browser';

export default function MyPage() {
  return (
    <div className="container mx-auto py-8">
      <CDNBrowser />
    </div>
  );
}
```

### Custom Path

The component automatically starts at the `kolleris/prismafiles/vculture` folder and restricts access to only this folder and its subfolders. Users cannot navigate to parent directories for security reasons.

## API Endpoints

### GET `/api/cdn?path={path}`

Fetches the contents of a CDN folder.

**Query Parameters:**
- `path` (optional): The folder path to browse (defaults to `prismafiles/vculture`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ObjectName": "folder/file.txt",
      "Length": 1024,
      "LastChanged": "2024-01-01T00:00:00Z",
      "IsDirectory": false,
      "fullUrl": "https://kolleris.b-cdn.net/prismafiles/folder/file.txt",
      "displayName": "file.txt",
      "size": "1 KB",
      "lastModified": "1/1/2024",
      "isDirectory": false
    }
  ],
        "currentPath": "prismafiles/vculture",
      "baseUrl": "https://kolleris.b-cdn.net/kolleris/prismafiles/vculture"
}
```

### POST `/api/cdn/upload`

Uploads files to the CDN.

**Form Data:**
- `file`: The file to upload
- `path` (optional): The target folder path

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "fileName": "example.txt",
        "path": "prismafiles/vculture/example.txt",
  "size": 1024
}
```

## Component Props

The `CDNBrowser` component doesn't accept any props and manages its own state internally.

## File Upload Component

The `FileUpload` component provides:

- Drag and drop file selection
- Multiple file upload support
- Progress tracking
- Error handling
- File management

### Props

```tsx
interface FileUploadProps {
  currentPath: string;           // Current CDN path
  onUploadComplete: () => void; // Callback when upload completes
  onClose: () => void;          // Callback to close the modal
}
```

## Customization

### Styling

The component uses Tailwind CSS classes and can be customized by modifying the className props or extending the component.

### Icons

Icons are from Lucide React. You can replace them with your preferred icon library.

### File Types

The component automatically detects file types and displays appropriate icons. You can extend this by adding custom file type handlers.

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Performance Considerations

- Files are fetched on-demand when navigating folders
- Search is debounced to prevent excessive API calls
- File uploads use XMLHttpRequest for progress tracking
- Component uses React.memo and useCallback for optimization

## Security

- API keys are stored server-side only
- File uploads are validated on the server
- No sensitive information is exposed to the client
- **Access Restrictions**: Users can only browse and upload within the `kolleris/prismafiles/vculture` folder
- **Server-side Validation**: API endpoints enforce folder access restrictions
- **Parent Directory Prevention**: Navigation above the restricted root is blocked

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure your BunnyCDN API key is correct and has proper permissions
2. **Storage Zone Not Found**: Verify the storage zone name matches your configuration
3. **Upload Failures**: Check file size limits and storage zone permissions
4. **CORS Issues**: Ensure your CDN is configured to allow uploads from your domain

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This component is part of the PrismaFiles project and follows the same licensing terms.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the BunnyCDN documentation
3. Open an issue in the project repository

---

**Note**: This component requires a valid BunnyCDN account and API key to function. Make sure you have sufficient storage and bandwidth allocation for your use case.
