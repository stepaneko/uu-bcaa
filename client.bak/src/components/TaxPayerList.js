import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function TaxPayerList() {
  const [taxPayers, setTaxPayers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taxPayerToDelete, setTaxPayerToDelete] = useState(null);

  useEffect(() => {
    fetchTaxPayers();
  }, []);

  const fetchTaxPayers = async () => {
    const res = await fetch('/taxpayers');
    const data = await res.json();
    setTaxPayers(data);
  };

  const confirmDelete = (tp) => {
    setTaxPayerToDelete(tp);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (taxPayerToDelete) {
      await fetch(`/taxpayers/${taxPayerToDelete.id}`, { method: 'DELETE' });
      setShowDeleteModal(false);
      setTaxPayerToDelete(null);
      fetchTaxPayers();
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Daňoví poplatníci</h2>
        <button className="btn btn-success">
          <i className="bi bi-plus-lg me-1"></i> Přidat poplatníka
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Název / Jméno</th>
                <th>IČO</th>
                <th>DIČ</th>
                <th>Typ</th>
                <th className="text-end">Akce</th>
              </tr>
            </thead>
            <tbody>
              {taxPayers.map(tp => (
                <tr key={tp.id}>
                  <td>{tp.type === 'company' ? tp.companyName : `${tp.firstName} ${tp.lastName}`}</td>
                  <td>{tp.registrationNumber}</td>
                  <td>{tp.vatId}</td>
                  <td>{tp.type === 'company' ? 'Firma' : 'Fyzická osoba'}</td>
                  <td className="text-end">
                    <button className="btn btn-sm btn-outline-primary me-2" title="Upravit">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" title="Smazat" onClick={() => confirmDelete(tp)}>
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Smazat poplatníka</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Opravdu chcete smazat daňového poplatníka <strong>{taxPayerToDelete?.companyName || taxPayerToDelete?.lastName}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Zrušit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Smazat
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}