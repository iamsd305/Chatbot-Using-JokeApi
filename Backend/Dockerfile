# Use GCC image
FROM gcc:latest

# Set working directory inside the cloud container
WORKDIR /usr/src/app

# Copy the server code
COPY server.c .

# Compile the code
RUN gcc server.c -o server -lcurl -pthread

# Run the server
CMD ["./server"]