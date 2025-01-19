# Image CDN API

This project provides an efficient and secure way to upload, process, and serve images via a Content Delivery Network (CDN) style API. It allows users to upload images, resize them, compress them for optimal performance, and cache them for faster future access. The API ensures that images are served in a quick and reliable manner with automatic cache cleanup and built-in security.

## Key Features

- **Image Upload & Processing**: Upload images directly via API requests, where you can specify optional transformations like resizing and adjusting the image quality.
  
- **Dynamic Image Resizing**: You can upload images in their original size or request resizing during the upload, whether by width, height, or both. This ensures you can provide images that fit your design requirements.
  
- **Automatic Image Compression**: Images are automatically compressed during processing to reduce file size without compromising quality. This makes serving images faster and more bandwidth-efficient.

- **Caching for Speed**: Once an image is processed (resized and compressed), it is cached for future use. This significantly improves response times for repeated requests for the same image.
  
- **Automatic Cache Cleanup**: Periodically, the cache is cleaned up to remove old files that are no longer needed. This ensures that your storage remains efficient and your server doesn’t become bloated with unused files.

- **Rate Limiting for Fair Usage**: To prevent misuse or overuse of resources, the API implements rate limiting. This ensures that the API can serve requests efficiently even under high traffic conditions.

- **Security Features**: The API uses security best practices like the Helmet middleware, which adds HTTP headers to secure your app from common web vulnerabilities.

## Use Case

This API is particularly useful in scenarios where:
- You need to serve images dynamically (with resizing) based on user requests.
- You want to optimize image storage and delivery by caching processed images for repeated access.
- You want to ensure a fast, secure, and reliable image serving experience.

### Example Use Cases:
- **E-commerce Websites**: Serve resized product images in various dimensions (thumbnails, medium-sized images, full-sized images) depending on where the user views them.
- **Social Media Platforms**: Automatically resize user-uploaded images for profile pictures, post previews, and full posts.
- **Blogs or Content Platforms**: Dynamically serve images in the most optimal size for mobile, tablet, or desktop views.
  
## Workflow

1. **Upload**: An image is uploaded to the API, either in its original format or resized via query parameters (e.g., width, height, quality).
2. **Processing**: The uploaded image is processed (resized and compressed).
3. **Caching**: The processed image is saved to a cache directory for future requests.
4. **Retrieval**: On subsequent requests, the processed image is served directly from the cache, saving time and resources.
5. **Cleanup**: Periodically, older cached images are removed to free up space and ensure efficient storage.

## Security

- **Rate Limiting**: To prevent excessive requests from the same user, the API limits the number of requests per IP within a given time period.
- **Secure Access**: The use of Helmet adds various HTTP security headers to safeguard against common web threats like Cross-Site Scripting (XSS), content injection, and more.

## How It Works

- **POST /upload**: Upload an image with optional query parameters for resizing (`width`, `height`) and quality (`quality`). The image will be processed, compressed, and cached for faster future access.
  
- **GET /cdn/:fileName**: Retrieve a cached image by its unique identifier. If the image is not cached, it will be processed and stored for future requests.

## Cache Management

The application includes an automatic cache cleanup mechanism that runs every day at midnight. It deletes any cached files that are older than 7 days, ensuring that outdated or unused files are not taking up unnecessary storage space.

## Why Use This API?

- **Faster User Experience**: The combination of dynamic image processing, caching, and compression ensures fast load times, which can significantly improve user experience, especially on image-heavy websites or apps.
  
- **Efficient Storage**: By storing processed images in cache and periodically cleaning old files, you ensure that only the most necessary images take up disk space, reducing storage overhead.

- **Secure and Scalable**: With rate limiting and security headers in place, this API is designed to handle a growing number of requests while maintaining security.

## License

This project is licensed under the MIT License.

