mvn clean install 
mkdir -p app && mv backend/target/backend-0.0.1-SNAPSHOT.jar app/wortomat.jar
cp app/wortomat.jar wortomat-app/jar && cd wortomat-app && npm install && npm run make && cd ..
sudo apt remove wortomat-app
cd wortomat-app/out/make/deb/x64 && sudo apt install ./wortomat-app_1.0.0_amd64.deb