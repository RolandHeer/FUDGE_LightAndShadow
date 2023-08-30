<img src="https://rolandheer.github.io/FUDGE_LightAndShadow/Miscellaneous/Logo/FudgeLightAndShadow.png" onload="document.querySelector('h1').style.visibility='hidden'"/>  

# ! Disclaimer !
This is a fork of the original FUDGE repository. It is used to work on the graphical capabilities of FUDGE and will specifically tackle Effects regarding Light and Shadow.

# Welcome!  
This repository is a fork of the original FUDGE repository. It contains the source code, the documentation and the full development history of FUDGE and FUDGE_LightAndShadow.

FUDGE is a lightweight open-source game engine and editor created for educating students in an academic environment in the field of design and development of games and highly interactive applications. It may also be used as a rapid prototyping tool to easly convey and evaluate ideas for applications and games and as a tool to create educational games.
This projects extends the functionality of FUDGE to achieve a higher visual fidelity.

# Example Scene
This Scene contains everything created in the FUDGE_LightAndShadow Project[Example Scene](https://github.com/lo-th/Oimo.js) 

# Folders
## Core  
Contains the core functionality of FUDGE needed to create games. It implements an entity component system to build scene graphs, prepares its content for rendering with WebGL2 and WebAudio, manages game loops and time, offers some standard meshes, shaders and a lighting system, handles user input and keyframe animation, serialization and more. For many games it's sufficient to work only with this module.  
See this [diagram](https://jirkadelloro.github.io/FUDGE/Documentation/Design/FUDGECoreClassdiagram.svg) to get an overview of its structure.  
## Physics  
Contains an adapted version of the Oimo-Physics-Engine that works with FUDGE. It supports rigidbodies of different shapes to approximate visual structures and impose physical behaviour, joints with several degrees of freedom and restrictions connecting rigidbodies, collision detection triggering events and raycasting for rigidbodies.  
For detailed explanation, visit the Physics-classes in the reference to FudgeCore and [OIMO.js](https://github.com/lo-th/Oimo.js)
## UserInterface  
Contains the classes for easy and even automatic creation of graphical interfaces using the mutator concept (see Wiki). This module is heavily used in the editor and can be used and extended for games.  
## Net  
Contains components for gaming over networks. It comes with a core implementation of a server and a client which dispatch events with a standardized message format. Clients connect with the server via WebSockets and to each other via RTC creating peer-to-peer connections. Clients and server offer the standard functionality to build a full mesh, where each client is connected to each other, or an authoritative host structure, where one client is connected to all others and serves as central hub for information.
## Aid  
Contains collections of classes for convenience, bundling and simplifying common procedures as well as experimental features that my probably become a core part in the future.  
## Editor  
The directory of the actual standalone editor to be executed with Electron or packed as executable by an Electron packager. The editor helps to setup a project and create complex scenes. The resulting graph and the resources created are stored in the file "Internal.json", the file "index.html" serves as the main file for the project. 
## Test  
Contains programs to test the functionality of various components of FUDGE separately, thus also serve as a resource for learning about those functionalities and how to set them up. Use a local server to run the tests locally on your machine.
## Miscellaneous	
A collection of various other documents and resources, including unmaintained experiments of developers who worked on FUDGE, and the thesis documents about aspects FUDGE former students graduated with. 
