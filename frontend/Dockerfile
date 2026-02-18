# Stage 1: Build the React app
FROM node:20-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Pass the env variable during build time (Vite needs this)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Copy the build output to replace default nginx files
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Copy a custom nginx config if you have one, or use default
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]