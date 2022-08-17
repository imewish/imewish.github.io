+++
date = 2022-08-14T18:30:00Z
draft = true
image_upload = ""
layout = "posts"
permalink = "understanding-osi-and-tcp-networking-model"
tags = ["aws", "osimodel", "osi", "networking"]
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

Some of the Application layer protocols are **HTTP, FTP, SMTP, NFC, MQTT, RPC, RTMP, etc**

#### Layer 6: Presentation

This layer operates as a data translator. it is responsible for making the data readable/presentable to and from the application layer. 

The presentation layer has the following functionalities,

**Translation**

Character code translation, converting ASCII to and from other formats, etc

**Encryption**

Encryption at the sender side and Decryption at the Receiver side

**Compression**

Compress the data received from the application layer before sending it to improve the speed of data transfer

Some of the Formats and Encoding managed by the presentation layer are **ASCI, JPEG, MPEG, MIDI, TLS, SSL, etc**

#### **Layer 5: Session Layer**

The session layer is responsible for managing the Authentication, Authorization, and Session restoration. The time between when the communication is opened and closed is known as the session. The session layer provides the mechanism for opening, closing, and managing a session between end-user application processes. It also ensures that the session stays open long enough to transfer all the data being exchanged, and then promptly closes the session in order to avoid wasting resources.

Some of the popular session layer protocols are, **RPC, RTCP, SCP, L2TP,  SMPP, etc**

#### **Layer 4: Transport Layer**

Layer 4 is responsible for end-to-end communication between the two devices. This includes taking data from the session layer and breaking it up into chunks called segments before sending it to layer 3.The transport layer on the receiving device is responsible for reassembling the segments into data the session layer can consume.

The transport layer is also responsible for flow control and error control. Flow control determines an optimal speed of transmission to ensure that a sender with a fast connection doesn’t overwhelm a receiver with a slow connection. The transport layer performs error control on the receiving end by ensuring that the data received is complete, and requesting retransmission if it isn’t.

Some of the popular Transport layer protocols are: **TCP, UDP, RDP**

#### **Layer 3: Network layer**

The network layer is responsible for packet forwarding including routing through intermediate routers, since it knows the address of neighboring network nodes, and it also manages the quality of service (QoS) and recognizes and forwards local host domain messages to the Transport layer (layer 4).

The network layer breaks up segments from the transport layer into smaller units, called packets, on the sender’s device, and reassembles these packets on the receiving device. The network layer also finds the best physical path for the data to reach its destination; this is known as routing.

This is where IP source and destination addressing is defined and rooting protocols are used to carry packets from source to destination across intermediate routers.

Some of the popular Network layer protocols are: **IPv4/IPv6**, **ICMP, IPsec**

#### **Layer 2: DataLink**

This layer is the protocol layer that transfers data between adjacent network nodes in a wide area network (WAN) or between nodes on the same local area network (LAN) segment. In other words data link layer is very similar to the network layer, except the data link layer facilitates data transfer between two devices on the SAME network. The data link layer takes packets from the network layer and breaks them into smaller pieces called frames. Like the network layer, the data link layer is also responsible for flow control and error control in intra-network communication (The transport layer only does flow control and error control for inter-network communications).

The data link layer is composed to two sub layers. The data link layer's first sub layer is the media access control, MAC layer. It's used to acquire source and destination addresses(like MAC Address of the destination machine) which are inserted into the frame.

Some of the popular DataLink layer protocols are: **ARP, Ethernet, PPP\\**

#### **Layer 1: Physical Layer**

The physical layer translates logical communications requests from the data link layer into hardware-specific operations to affect transmission or reception of electronic signals.The Physical layer includes the physical equipment involved in the data transfer, such as the cables and switches. This is also the layer where the data gets converted into a bit stream, which is a string of 1s and 0s. The physical layer of both devices must also agree on a signal convention so that the 1s can be distinguished from the 0s on both devices.

Some of the popular Physical layer technologies are: **USB, Network modems, Ethernet Physical Layer, GSM, Bluetooth Physical Layer**