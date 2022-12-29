mvn clean install 
mkdir -p app && mv backend/target/backend-0.0.1-SNAPSHOT.jar app/wortomat.jar
cp app/wortomat.jar wortomat-app/jar && cd wortomat-app && npm install && npm run make && cd ..
sudo dnf remove wortomat-app
cd wortomat-app/out/make/rpm/x64 && sudo dnf install wortomat-app-1.0.0-1.x86_64.rpm