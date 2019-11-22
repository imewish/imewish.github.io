---
tags:
- blockachain
- blog
- maticnetwork
layout: Home
title: Heimdall and Bor – Matic’s Validator and Block Production layers
text: ''
multiupload: []
image_upload: "/uploads/heimdall-bor.png"

---
![](/uploads/heimdall-bor.png)

 Heimdall is a hybrid Plasma + Proof-of-Stake (PoS) platform. We use a dual-consensus architecture on the Matic Network to optimize for speed and decentralization. We consciously architected the system to support arbitrary state transitions on our sidechains, which are EVM-enabled

Plasma security guarantees hold for specific state transitions such as the ones we write Plasma predicates for (that we got into details in our last article on predicates – [**https://blog.matic.network/plasma-predicates-one-step-towards-generalized-plasma/**](https://blog.matic.network/plasma-predicates-one-step-towards-generalized-plasma/ "https://blog.matic.network/plasma-predicates-one-step-towards-generalized-plasma/")). However, the architecture is such that developers can choose to make use of both in the same application based on their needs.

Developers can use Plasma for specific state transitions for which Plasma predicates have been written such as ERC20, ERC721, asset swaps or other custom predicates. For arbitrary state transitions, they can use PoS. Or both! This is made possible by our hybrid construction.