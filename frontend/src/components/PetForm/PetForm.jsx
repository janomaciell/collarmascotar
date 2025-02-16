import React, { useState } from 'react';
import './PetForm.css';

const PetForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    age: initialData.age || '',
    breed: initialData.breed || '',
    address: initialData.address || '',
    phone: initialData.phone || '',
    notes: initialData.notes || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'age' ? parseInt(value) || '' : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="pet-form">
      <div className="form-group">
        <label htmlFor="name">Nombre de la Mascota *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="age">Edad (años) *</label>
        <input
          type="number"
          id="age"
          name="age"
          min="0"
          max="30"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="breed">Raza</label>
        <input
          type="text"
          id="breed"
          name="breed"
          value={formData.breed}
          onChange={handleChange}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="address">Dirección *</label>
        <textarea
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="phone">Teléfono de Contacto *</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="notes">Notas Adicionales</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Medicación, comportamiento, etc."
        />
      </div>
      
      <button type="submit" className="submit-button">
        {initialData.id ? 'Actualizar Mascota' : 'Crear Mascota'}
      </button>
    </form>
  );
};

export default PetForm; 