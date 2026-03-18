# Stage 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

# Set build-time environment variables if needed
# ARG VITE_API_URL
# ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts to nginx folder
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port (Render will proxy to this)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
