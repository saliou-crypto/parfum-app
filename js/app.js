// ========== UTILITAIRES ==========

function getProduits() {
  return JSON.parse(localStorage.getItem('produits')) || [];
}

function saveProduits(produits) {
  localStorage.setItem('produits', JSON.stringify(produits));
}

function getVentes() {
  return JSON.parse(localStorage.getItem('ventes')) || [];
}

function saveVentes(ventes) {
  localStorage.setItem('ventes', JSON.stringify(ventes));
}

function formaterDate(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// ========== PRODUITS ==========

function ajouterProduit() {
  const nom = document.getElementById('nom-produit').value.trim();
  const prix = parseInt(document.getElementById('prix-produit').value);
  const stock = parseInt(document.getElementById('stock-produit').value);

  if (!nom || !prix || !stock) {
    alert('Remplis tous les champs !');
    return;
  }

  const produits = getProduits();
  produits.push({ id: Date.now(), nom, prix, stock });
  saveProduits(produits);

  document.getElementById('nom-produit').value = '';
  document.getElementById('prix-produit').value = '';
  document.getElementById('stock-produit').value = '';

  afficherProduits();
}

function supprimerProduit(id) {
  let produits = getProduits().filter(p => p.id !== id);
  saveProduits(produits);
  afficherProduits();
}

function ouvrirModification(id) {
  const produits = getProduits();
  const p = produits.find(p => p.id === id);
  if (!p) return;

  document.getElementById('nom-produit').value = p.nom;
  document.getElementById('prix-produit').value = p.prix;
  document.getElementById('stock-produit').value = p.stock;

  const btn = document.querySelector('.formulaire button');
  btn.textContent = 'Modifier le produit';
  btn.onclick = () => enregistrerModification(id);

  document.querySelector('.formulaire').scrollIntoView({ behavior: 'smooth' });
}

function enregistrerModification(id) {
  const nom = document.getElementById('nom-produit').value.trim();
  const prix = parseInt(document.getElementById('prix-produit').value);
  const stock = parseInt(document.getElementById('stock-produit').value);

  if (!nom || !prix || !stock) {
    alert('Remplis tous les champs !');
    return;
  }

  let produits = getProduits();
  produits = produits.map(p => p.id === id ? { ...p, nom, prix, stock } : p);
  saveProduits(produits);

  const btn = document.querySelector('.formulaire button');
  btn.textContent = 'Ajouter le produit';
  btn.onclick = ajouterProduit;

  document.getElementById('nom-produit').value = '';
  document.getElementById('prix-produit').value = '';
  document.getElementById('stock-produit').value = '';

  afficherProduits();
}

function afficherProduits() {
  const liste = document.getElementById('liste-produits');
  if (!liste) return;

  const produits = getProduits();
  if (produits.length === 0) {
    liste.innerHTML = '<p class="vide">Aucun produit ajouté</p>';
    return;
  }

  liste.innerHTML = produits.map(p => `
    <div class="produit-item">
      <div class="produit-icon">🌸</div>
      <div class="produit-info">
        <p>${p.nom}</p>
        <p>${p.prix.toLocaleString()} F CFA · Stock: ${p.stock}</p>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn-modifier" onclick="ouvrirModification(${p.id})">✏️</button>
        <button class="btn-supprimer" onclick="supprimerProduit(${p.id})">🗑</button>
      </div>
    </div>
  `).join('');
}

// ========== VENTES ==========

function chargerSelectProduits() {
  const select = document.getElementById('produit-vente');
  if (!select) return;

  const produits = getProduits();
  select.innerHTML = '<option value="">-- Choisir un parfum --</option>';
  produits.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.nom} — ${p.prix.toLocaleString()} F CFA (stock: ${p.stock})</option>`;
  });

  select.addEventListener('change', calculerTotal);
  document.getElementById('quantite-vente')?.addEventListener('input', calculerTotal);
}

function calculerTotal() {
  const selectEl = document.getElementById('produit-vente');
  const qte = parseInt(document.getElementById('quantite-vente').value) || 0;
  const produits = getProduits();
  const produit = produits.find(p => p.id == selectEl.value);
  const total = produit ? produit.prix * qte : 0;
  document.getElementById('total-vente').textContent = total.toLocaleString() + ' F CFA';
}

function enregistrerVente() {
  const selectEl = document.getElementById('produit-vente');
  const qte = parseInt(document.getElementById('quantite-vente').value);
  const client = document.getElementById('client-vente').value.trim();

  if (!selectEl.value || !qte || qte <= 0) {
    alert('Choisis un produit et une quantité valide !');
    return;
  }

  let produits = getProduits();
  const produit = produits.find(p => p.id == selectEl.value);

  if (!produit) return;

  if (qte > produit.stock) {
    alert(`Stock insuffisant ! Il reste seulement ${produit.stock} unité(s).`);
    return;
  }

  produit.stock -= qte;
  saveProduits(produits);

  const ventes = getVentes();
  ventes.unshift({
    id: Date.now(),
    produitId: produit.id,
    produitNom: produit.nom,
    prix: produit.prix,
    quantite: qte,
    total: produit.prix * qte,
    client: client || 'Client anonyme',
    date: Date.now()
  });
  saveVentes(ventes);

  alert('Vente enregistrée ! ✅');

  selectEl.value = '';
  document.getElementById('quantite-vente').value = '';
  document.getElementById('client-vente').value = '';
  document.getElementById('total-vente').textContent = '0 F CFA';

  afficherHistoriqueVentes();
  chargerSelectProduits();
}

function supprimerVente(id) {
  if (!confirm('Supprimer cette vente et sa facture ?')) return;

  // Récupérer la vente AVANT de la supprimer pour remettre le stock
  const vente = getVentes().find(v => v.id === id);

  if (vente) {
    let produits = getProduits();
    const produit = produits.find(p => p.id === vente.produitId);
    if (produit) {
      produit.stock += vente.quantite;
      saveProduits(produits);
    }
  }

  // Supprimer la vente
  saveVentes(getVentes().filter(v => v.id !== id));

  // Supprimer la facture liée
  saveFactures(getFactures().filter(f => f.venteId !== id));

  afficherHistoriqueVentes();
  afficherDernieresVentes();
  calculerStats();
  afficherListeFactures();
}

function afficherHistoriqueVentes() {
  const liste = document.getElementById('historique-ventes');
  if (!liste) return;

  const ventes = getVentes();
  if (ventes.length === 0) {
    liste.innerHTML = '<p class="vide">Aucune vente enregistrée</p>';
    return;
  }

  liste.innerHTML = ventes.map(v => `
    <div class="vente-item">
      <div class="vente-info" onclick="genererPDFDepuisVente(${v.id})" style="cursor:pointer; flex:1;">
        <p>${v.produitNom} x${v.quantite}</p>
        <p>${v.client} · ${formaterDate(v.date)}</p>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
        <span class="vente-montant">+${v.total.toLocaleString()} F</span>
        <button onclick="supprimerVente(${v.id})" style="background:none; border:none; font-size:16px; cursor:pointer;">🗑</button>
      </div>
    </div>
  `).join('');
}

// ========== ACCUEIL ==========

function afficherDernieresVentes() {
  const liste = document.getElementById('dernières-ventes');
  if (!liste) return;

  const ventes = getVentes().slice(0, 5);
  if (ventes.length === 0) {
    liste.innerHTML = '<p class="vide">Aucune vente enregistrée</p>';
    return;
  }

  liste.innerHTML = `<div class="ventes-liste">${ventes.map(v => `
    <div class="vente-item">
      <div class="vente-info">
        <p>${v.produitNom} x${v.quantite}</p>
        <p>${v.client} · ${formaterDate(v.date)}</p>
      </div>
      <span class="vente-montant">+${v.total.toLocaleString()} F</span>
    </div>
  `).join('')}</div>`;
}

function calculerStats() {
  const venteJourEl = document.getElementById('ventes-jour');
  const venteMoisEl = document.getElementById('ventes-mois');
  if (!venteJourEl || !venteMoisEl) return;

  const ventes = getVentes();
  const now = new Date();

  const totalJour = ventes
    .filter(v => new Date(v.date).toDateString() === now.toDateString())
    .reduce((sum, v) => sum + v.total, 0);

  const totalMois = ventes
    .filter(v => {
      const d = new Date(v.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, v) => sum + v.total, 0);

  venteJourEl.textContent = totalJour.toLocaleString() + ' F';
  venteMoisEl.textContent = totalMois.toLocaleString() + ' F';
}

// ========== FACTURES ==========

let factureEnCours = null;

function getFactures() {
  return JSON.parse(localStorage.getItem('factures')) || [];
}

function saveFactures(factures) {
  localStorage.setItem('factures', JSON.stringify(factures));
}

function genererPDFDepuisVente(id) {
  const vente = getVentes().find(v => v.id === id);
  if (!vente) return;

  const numero = 'FAC-' + vente.id.toString().slice(-6);
  const date = new Date(vente.date).toLocaleDateString('fr-FR');

  // Sauvegarder dans l'historique si pas déjà présent
  const factures = getFactures();
  const existe = factures.find(f => f.venteId === vente.id);
  if (!existe) {
    factures.unshift({
      id: Date.now(),
      venteId: vente.id,
      numero,
      client: vente.client,
      produitNom: vente.produitNom,
      prix: vente.prix,
      quantite: vente.quantite,
      total: vente.total,
      date: vente.date
    });
    saveFactures(factures);
  }

  factureEnCours = { vente, numero, date };

  document.getElementById('modal-numero').textContent = 'N° ' + numero;
  document.getElementById('modal-date').textContent = 'Date : ' + date;
  document.getElementById('modal-client').textContent = 'Client : ' + vente.client;
  document.getElementById('modal-lignes').innerHTML = `
    <tr>
      <td>${vente.produitNom}</td>
      <td>${vente.quantite}</td>
      <td>${vente.prix.toLocaleString()} F</td>
      <td>${vente.total.toLocaleString()} F</td>
    </tr>
  `;
  document.getElementById('modal-total').textContent = vente.total.toLocaleString() + ' F CFA';

  document.getElementById('modal-overlay').style.display = 'flex';
  afficherListeFactures();
}

function fermerModal() {
  document.getElementById('modal-overlay').style.display = 'none';
  factureEnCours = null;
}

function telechargerDepuisModal() {
  if (!factureEnCours) return;
  const { vente, numero, date } = factureEnCours;

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFillColor(192, 38, 211);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Parfums by Bousso', 14, 16);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Vente de parfums de qualité', 14, 24);
  doc.text('Touba, Sénégal', 14, 30);

  doc.setTextColor(50, 50, 50);
  doc.setFontSize(11);
  doc.text('FACTURE', 14, 48);
  doc.setFontSize(10);
  doc.text('N° : ' + numero, 14, 56);
  doc.text('Date : ' + date, 14, 63);
  doc.text('Client : ' + vente.client, 14, 70);

  doc.setDrawColor(192, 38, 211);
  doc.setLineWidth(0.5);
  doc.line(14, 75, 196, 75);

  doc.setFillColor(245, 245, 245);
  doc.rect(14, 78, 182, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Produit', 16, 84);
  doc.text('Qté', 110, 84);
  doc.text('Prix unitaire', 130, 84);
  doc.text('Total', 172, 84);

  doc.setFont('helvetica', 'normal');
  doc.setFillColor(252, 232, 255);
  doc.rect(14, 91, 182, 8, 'F');
  doc.text(vente.produitNom, 16, 97);
  doc.text(String(vente.quantite), 112, 97);
  doc.text(vente.prix.toLocaleString() + ' F', 130, 97);
  doc.text(vente.total.toLocaleString() + ' F', 172, 97);

  doc.setLineWidth(0.5);
  doc.line(14, 105, 196, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL : ' + vente.total.toLocaleString() + ' F CFA', 130, 113);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text('Merci pour votre achat ! — Parfums by Bousso', 14, 280);

  doc.save('facture-' + numero + '.pdf');
}

function afficherListeFactures() {
  const liste = document.getElementById('liste-factures');
  if (!liste) return;

  const factures = getFactures();
  if (factures.length === 0) {
    liste.innerHTML = '<p class="vide">Aucune facture générée</p>';
    return;
  }

  liste.innerHTML = factures.map(f => `
    <div class="vente-item" onclick="ouvrirFacture(${f.venteId})" style="cursor:pointer;">
      <div class="vente-info">
        <p>${f.numero} — ${f.produitNom}</p>
        <p>${f.client} · ${formaterDate(f.date)}</p>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
        <span class="vente-montant">${f.total.toLocaleString()} F</span>
        <span style="font-size:10px; color:#c026d3;">👁 Voir</span>
      </div>
    </div>
  `).join('');
}

function ouvrirFacture(venteId) {
  genererPDFDepuisVente(venteId);
}

// ========== INIT ==========

document.addEventListener('DOMContentLoaded', () => {
  afficherProduits();
  afficherDernieresVentes();
  afficherHistoriqueVentes();
  afficherListeFactures();
  calculerStats();
  chargerSelectProduits();
});