const express = require('express');
const router = express.Router();
const produitService = require('../services/clientService');
const grpcClient = require('../services/clientMicroservice');

// Routes REST
// router.get('/produits', produitService.getProduits);
// router.get('/produits/:id', produitService.getProduitById);
// router.post('/produits', produitService.createProduit);
// router.put('/produits/:id', produitService.updateProduit);
// router.delete('/produits/:id', produitService.deleteProduit);
router.get('/exemple', (req, res) => {
    res.send('hello');
});
// Routes gRPC
router.get('/grpc/produits', async (req, res) => {
  try {
    const produits = await grpcClient.getProduitsGRPC();
    res.json(produits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/grpc/produits/:id', async (req, res) => {
  try {
    const produit = await grpcClient.getProduitByIdGRPC(req.params.id);
    res.json(produit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/grpc/produits', async (req, res) => {
  try {
    const newProduit = await grpcClient.createProduitGRPC(req.body);
    res.status(201).json(newProduit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/grpc/produits/:id', async (req, res) => {
  try {
    const updatedProduit = await grpcClient.updateProduitGRPC(req.params.id, req.body);
    res.json(updatedProduit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/grpc/produits/:id', async (req, res) => {
  try {
    await grpcClient.deleteProduitGRPC(req.params.id);
    res.json({ message: "Produit supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
