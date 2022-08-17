+++
date = 2022-08-14T18:30:00Z
draft = true
image_upload = ""
layout = ""
permalink = "understanding-osi-and-tcp-networking-model"
tags = []
title = "Understanding OSI and TCP/IP networking model"

+++
The OSI Model defines a networking framework to implement protocols in seven layers. OSI stands for open system interconnection. It was introduced in 1984. Designed to be an abstract model and teaching tool, the OSI Model remains a useful tool for learning about today's network technologies such as Ethernet and protocols like IP.

This model is divided into 7 Layers.

![osi-model-layers](/static/uploads/osi-1.jpeg "OSI-Model-Layers")

The data communication on the OSI model starts at the Application layer of the sender side and goes up to the physical layer. From there the data will be sent to the physical layer of the receiver side and goes up to the application layer.

These 7 layers are grouped into two groups.

The first four layers(Application, Presentation, Session, Transport) are grouped and called Host layers. And it contains application-level data and is responsible for accurate data delivery between devices. The host layers interoperate end to end.

The last 2 layers are grouped together and called Media Layers. These layers make sure the data is transmitted correctly to the destination. These layers communicate peer to peer.

Let's get to know these layers in detail,

#### **Layer 7: Application**

The Application layer helps applications to talk to the network services or it acts as an interface between applications and the network. 

Applications like browsers, Email Clients, and Mobile apps use this layer to initiate a network connection.

Some of the Application layer protocols are HTTP, FTP, SMTP, NFC, MQTT, RPC, RTMP, etc

#### Layer 6: Presentation

This layer operates as a data translator. it is responsible for making the data readable/presentable to and from the application layer. 

The presentation layer has the following functionalities,

**Translation**

Character code translation, converting ASCII to and from other formats, etc

**Encryption**

Encryption at the sender side and Decryption at the Receiver side

**Compression**

Compress the data received from the application layer before sending it to improve the speed of data transfer

Some of the Formats and Encoding managed by the presentation layer are ASCI, JPEG, MPEG, MIDI, TLS, SSL, etc

#### **Layer 5: Session Layer**

The session layer is responsible for managing the Authentication, Authorization, and Session restoration. The time between when the communication is opened and closed is known as the session. The session layer provides the mechanism for opening, closing, and managing a session between end-user application processes. It also ensures that the session stays open long enough to transfer all the data being exchanged, and then promptly closes the session in order to avoid wasting resources.

Some of the popular session layer protocols are, **RPC, RTCP, SCP, L2TP,  SMPP, etc**

#### **Layer 4: Transport Layer**

Layer 4 is responsible for end-to-end communication between the two devices. This includes taking data from the session layer and breaking it up into chunks called segments before sending it to layer 3.The transport layer on the receiving device is responsible for reassembling the segments into data the session layer can consume.

The transport layer is also responsible for flow control and error control. Flow control determines an optimal speed of transmission to ensure that a sender with a fast connection doesn’t overwhelm a receiver with a slow connection. The transport layer performs error control on the receiving end by ensuring that the data received is complete, and requesting retransmission if it isn’t.