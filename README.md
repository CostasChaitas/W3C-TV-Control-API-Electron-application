# FOKUS TV

Source Code for the Web TV application. 

A packaged version can be found in the release branch.

##### Note: Close the application over the close button and not by killing it over the terminal. 
This will ensure every process will be closed properly and you don't lock the dvbt-stick.

### Installation

Clone the branch

    git clone https://gitlab.fokus.fraunhofer.de/theses/awt-tv-web-app.git
    
Install the latest version of Node.js (v7)

    wget -qO- https://deb.nodesource.com/setup_7.x | sudo bash -
    sudo apt-get install -y nodejs


Install Electron globally with:

    sudo npm install -g electron

You can execute the electron application now in the root folder with:

    electron .
    
Make sure you installed the declared dependencies below.
    
### Dependencies

##### 1) FFMPEG
    
In order to get the latest version 3.2  do this:

    sudo add-apt-repository ppa:jonathonf/ffmpeg-3
    
    sudo apt update && sudo apt install ffmpeg libav-tools x264 x265

##### 2) Install the firmware for the dvbt-stick as described in the node-tuner module readme

### Errors and Workarounds

If you encouter these errors, here are the solutions which worked for me.

**1)** *Error: Could not locate the bindings file*

    npm rebuild

**2)** *Module version mismatch. Expected 50, got 49* (or any other version mismatch)

    npm rebuild --runtime=electron --target=1.6.1 --disturl=https://atom.io/download/atom-shell --build-from-source

