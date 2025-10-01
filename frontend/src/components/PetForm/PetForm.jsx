import React, { useState } from 'react';
import './PetForm.css';

const PetForm = ({ onSubmit, initialData = {} }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    age: initialData.age || '',
    breed: initialData.breed || '',
    address: initialData.address || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    notes: initialData.notes || '',
    photo: null,
    allergies: initialData.allergies || '',
    medical_conditions: initialData.medical_conditions || '',
    blood_type: initialData.blood_type || '',
    weight: initialData.weight || '',
    microchip_id: initialData.microchip_id || '',
    birth_date: initialData.birth_date || '',
    gender: initialData.gender || '',
    is_sterilized: initialData.is_sterilized || false,
    sterilization_date: initialData.sterilization_date || '',
    vet_name: initialData.vet_name || '',
    vet_phone: initialData.vet_phone || '',
    vet_address: initialData.vet_address || '',
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      setFormData({
        ...formData,
        [name]: files[0],
      });
      
      if (files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result);
        };
        reader.readAsDataURL(files[0]);
      } else {
        setPhotoPreview(null);
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.age || formData.age < 0 || formData.age > 30) {
      newErrors.age = 'La edad debe estar entre 0 y 30 años';
    }

    if (!formData.address) {
      newErrors.address = 'La dirección es obligatoria';
    }

    if (!formData.phone || !formData.phone.match(/^\d{10}$/)) {
      newErrors.phone = 'El teléfono debe tener 10 dígitos';
    }

    if (formData.email && !formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('FormData antes de enviar:', formData); // Debug: Log the formData state

      // Pass the plain formData object to onSubmit
      await onSubmit(formData);
    } catch (error) {
      console.error('Error en PetForm:', error);
      setErrors({ submit: 'Error al enviar el formulario' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pet-form">
      <div className="form-section">
        <h3>Información Básica</h3>
        <div className="form-group">
          <label htmlFor="photo">Foto de la Mascota</label>
          <input
            type="file"
            id="photo"
            name="photo"
            accept="image/*"
            onChange={handleChange}
          />
          {photoPreview && (
            <div className="photo-preview-container">
              <img 
                src={photoPreview} 
                alt="Preview" 
                className="photo-preview"
              />
              <button 
                type="button" 
                className="remove-photo-button"
                onClick={() => {
                  setFormData({ ...formData, photo: null });
                  setPhotoPreview(null);
                }}
              >
                ✕ Eliminar foto
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="name">Nombre de la Mascota *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
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
            className={errors.age ? 'error' : ''}
          />
          {errors.age && <span className="error-message">{errors.age}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="birth_date">Fecha de Nacimiento</label>
          <input
            type="date"
            id="birth_date"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
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
          <label htmlFor="gender">Género</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Seleccionar</option>
            <option value="M">Macho</option>
            <option value="F">Hembra</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="address">Dirección *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            autoComplete="street-address"
            placeholder="Ej: Calle y número, ciudad"
            className={errors.address ? 'error' : ''}
          />
          {errors.address && <span className="error-message">{errors.address}</span>}
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
            inputMode="numeric"
            autoComplete="tel"
            className={errors.phone ? 'error' : ''}
          />
          {errors.phone && <span className="error-message">{errors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="ejemplo@correo.com"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && <span className="error-message">{errors.email}</span>}
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
      </div>

      <div className="form-section">
        <h3>Información de Salud</h3>
        <div className="form-group">
          <label htmlFor="weight">Peso (kg)</label>
          <input
            type="number"
            id="weight"
            name="weight"
            step="0.1"
            value={formData.weight}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="allergies">Alergias</label>
          <textarea
            id="allergies"
            name="allergies"
            value={formData.allergies}
            onChange={handleChange}
            placeholder="Describe las alergias conocidas"
          />
        </div>

        <div className="form-group">
          <label htmlFor="medical_conditions">Condiciones Médicas</label>
          <textarea
            id="medical_conditions"
            name="medical_conditions"
            value={formData.medical_conditions}
            onChange={handleChange}
            placeholder="Condiciones médicas crónicas o importantes"
          />
        </div>

        <div className="form-group">
          <label htmlFor="is_sterilized" style={{ marginBottom: '0.7rem' }}>¿Está esterilizado/a?</label>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="is_sterilized"
              name="is_sterilized"
              checked={formData.is_sterilized}
              onChange={handleChange}
              className="toggle-switch-checkbox"
            />
            <label className="toggle-switch-label" htmlFor="is_sterilized">
              <span className="toggle-switch-inner" />
              <span className="toggle-switch-switch" />
            </label>
            <span className="toggle-switch-text">
              {formData.is_sterilized ? 'Sí' : 'No'}
            </span>
          </div>
        </div>

        {formData.is_sterilized && (
          <div className="form-group">
            <label htmlFor="sterilization_date">Fecha de Esterilización</label>
            <input
              type="date"
              id="sterilization_date"
              name="sterilization_date"
              value={formData.sterilization_date}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      <div className="form-section">
        <h3>Información del Veterinario</h3>
        <div className="form-group">
          <label htmlFor="vet_name">Nombre del Veterinario</label>
          <input
            type="text"
            id="vet_name"
            name="vet_name"
            value={formData.vet_name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="vet_phone">Teléfono del Veterinario</label>
          <input
            type="tel"
            id="vet_phone"
            name="vet_phone"
            value={formData.vet_phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="vet_address">Dirección del Veterinario</label>
          <textarea
            id="vet_address"
            name="vet_address"
            value={formData.vet_address}
            onChange={handleChange}
          />
        </div>
      </div>

      <button 
        type="submit" 
        className={`submit-button ${isSubmitting ? 'loading' : ''}`}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Enviando...' : (initialData.id ? 'Actualizar Mascota' : 'Crear Mascota')}
      </button>
      {errors.submit && <span className="error-message">{errors.submit}</span>}
    </form>
  );
};

export default PetForm;