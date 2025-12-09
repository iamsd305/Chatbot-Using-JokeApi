#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <netinet/in.h>
#include <pthread.h>
#include <curl/curl.h>

#define BUFFER_SIZE 4096

// Helper to get the Port from Cloud Environment (or default to 7777 locally)
int get_port() {
    char *env_port = getenv("PORT");
    if (env_port) {
        return atoi(env_port);
    }
    return 7777;
}

struct string {
    char *ptr;
    size_t len;
};

size_t write_callback(void *ptr, size_t size, size_t nmemb, struct string *s) {
    size_t new_len = s->len + size * nmemb;
    s->ptr = realloc(s->ptr, new_len + 1);
    if (s->ptr == NULL) {
        fprintf(stderr, "realloc() failed\n");
        return 0;
    }
    memcpy(s->ptr + s->len, ptr, size * nmemb);
    s->ptr[new_len] = '\0';
    s->len = new_len;
    return size * nmemb;
}

void make_api_call(const char *user_input, char *output_buffer) {
    CURL *curl;
    CURLcode res;
    char api_url[BUFFER_SIZE + 512];
    
    struct string s;
    s.len = 0;
    s.ptr = malloc(s.len + 1);
    if (s.ptr == NULL) return;
    s.ptr[0] = '\0';

    char clean_input[BUFFER_SIZE];
    int j = 0;
    for(int i = 0; user_input[i] != '\0' && j < BUFFER_SIZE - 1; i++) {
        if(user_input[i] == ' ') {
            if (j < BUFFER_SIZE - 4) {
                clean_input[j++] = '%'; clean_input[j++] = '2'; clean_input[j++] = '0';
            }
        } else {
            clean_input[j++] = user_input[i];
        }
    }
    clean_input[j] = '\0';

    snprintf(api_url, sizeof(api_url), "https://v2.jokeapi.dev/joke/Any?contains=%s&format=txt", clean_input);

    curl = curl_easy_init();
    if(curl) {
        curl_easy_setopt(curl, CURLOPT_URL, api_url);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &s);
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
        
        res = curl_easy_perform(curl);
        if(res != CURLE_OK) {
            snprintf(output_buffer, BUFFER_SIZE, "API Error: %s", curl_easy_strerror(res));
        } else {
            strncpy(output_buffer, s.ptr, BUFFER_SIZE - 1);
            output_buffer[BUFFER_SIZE - 1] = '\0'; 
        }
        curl_easy_cleanup(curl);
    } else {
        strcpy(output_buffer, "Error initializing curl");
    }
    free(s.ptr);
}

void *client_handler(void *socket_desc) {
    int sock = *(int*)socket_desc;
    free(socket_desc);

    char buffer[BUFFER_SIZE];
    char api_response[BUFFER_SIZE];
    char http_response[BUFFER_SIZE + 1024]; 

    memset(buffer, 0, BUFFER_SIZE);
    int valread = read(sock, buffer, BUFFER_SIZE);
    if (valread <= 0) {
        close(sock);
        return 0;
    }

    char keyword[100] = {0};
    
    if (sscanf(buffer, "GET /%99s ", keyword) == 1) {
        if (strstr(keyword, "favicon") != NULL) {
             strcpy(api_response, "");
        } else {
             printf("Web Client asked for: %s\n", keyword);
             make_api_call(keyword, api_response);
             if (strlen(api_response) == 0) {
                 strcpy(api_response, "No joke found.");
             }
        }
    } else {
        strcpy(api_response, "Welcome! Use /keyword to get a joke.");
    }

    // CORS HEADERS (Required for Vercel <-> Render communication)
    snprintf(http_response, sizeof(http_response),
        "HTTP/1.1 200 OK\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Content-Type: text/plain\r\n"
        "Content-Length: %ld\r\n"
        "Connection: close\r\n"
        "\r\n"
        "%s", 
        strlen(api_response), 
        api_response);

    send(sock, http_response, strlen(http_response), 0);
    close(sock); 
    return 0;
}

int main() {
    int server_fd, *new_sock; 
    struct sockaddr_in address;
    int addrlen = sizeof(address);
    
    // DYNAMIC PORT ASSIGNMENT
    int port = get_port();

    if ((server_fd = socket(AF_INET, SOCK_STREAM, 0)) == 0) {
        perror("Socket failed");
        exit(EXIT_FAILURE);
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    address.sin_family = AF_INET;
    address.sin_addr.s_addr = INADDR_ANY;
    address.sin_port = htons(port);

    if (bind(server_fd, (struct sockaddr *)&address, sizeof(address)) < 0) {
        perror("Bind failed");
        exit(EXIT_FAILURE);
    }

    if (listen(server_fd, 10) < 0) { 
        perror("Listen failed");
        exit(EXIT_FAILURE);
    }

    printf("Server is ready on port %d\n", port);

    while(1) {
        new_sock = malloc(sizeof(int)); 
        
        if ((*new_sock = accept(server_fd, (struct sockaddr *)&address, (socklen_t*)&addrlen)) < 0) {
            perror("Accept failed");
            free(new_sock); 
            continue;
        }

        pthread_t sniffer_thread;
        if (pthread_create(&sniffer_thread, NULL, client_handler, (void*) new_sock) < 0) {
            perror("Could not create thread");
            free(new_sock);
            return 1;
        }
        pthread_detach(sniffer_thread);
    }
    return 0;
}