# php-quick-wordpress
## Getting Started
### Prerequisites
- [Docker](https://www.docker.com/get-started)
### Running Locally
1. **Clone the project and navigate to the root directory**
    ```bash
    git clone https://github.com/sheginabo/php-quick-wordpress.git && cd php-quick-wordpress
    ```
2. **Grant script permissions and download the appropriate version**
   ```bash
    chmod +x ./download_wordpress.sh && ./download_wordpress.sh
   ```
3. **Run docker-compose.yml**
   ```bash
    docker-compose -p wordpress_demo up -d
   ```
   If you want a very clean build, use the following command
   ```bash
    docker-compose build --no-cache && docker-compose -p wordpress_demo up --force-recreate -d
   ```
4. **壓力測試(need k6 first)**
   ```bash
    k6 run ./k6/test.js
   ```