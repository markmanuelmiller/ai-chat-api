FROM node:18-alpine

# Install required dependencies for shell scripts
RUN apk add --no-cache bash jq findutils

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Create log directories with proper permissions
RUN mkdir -p /var/log/foundation/binlog/active /var/log/foundation/binlog/done && \
    chmod 755 /var/log/foundation/binlog/active /var/log/foundation/binlog/done

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 3000

# Run application
CMD ["node", "dist/index.js"]