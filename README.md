# wortomat

Are you a writer? 

Do you often lose track of your open plot issues?

Are you drowning in your own plot?   

Then wortomat might be just the tool for you :) 

![Screenshot](/about/wortomat-screenshot.png)

## Current state

This is merely a prototype. There might be bugs. More features will come. If you want to help me, please contact me :)


## Usage 

Once the product is mature enough for a release candidate, there will be a downloadable software. Until then, you need to build it yourself. 

But it's easy! Clone the repository and let Maven build the thing for you: 

```
git clone https://github.com/SimoneSchaefer/wortomat.git
cd wortomat
mvn clean install
```

This will create a JAR file in the backend/target folder that you can run by

```
java -jar backend/target/backend-0.0.1-SNAPSHOT.jar 
```

Open your browser on http://localhost:8085. 

Happy writing!


## Disclaimer

If you want to use wortomat, make sure you backup regularely (see 'Current State'). The stored data is located in your home folder - look fpr a folder wortomat.  
I won't take any responsibility for data loss. 



