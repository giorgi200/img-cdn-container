# Use a lightweight Node.js image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy dependencies and install them
COPY package.json package-lock.json ./
RUN npm install

# Copy source files
COPY src ./src

# Create necessary directories
RUN mkdir -p /app/uploads /app/cache

# Expose the API port
EXPOSE 3000

# Start the API
CMD ["npm", "start"]

