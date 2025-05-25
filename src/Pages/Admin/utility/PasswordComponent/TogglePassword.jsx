import { useState } from 'react';

export default function TogglePassword() {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = () => setVisible(prev => !prev);

  const inputType = visible ? 'text' : 'password';
  const iconClass = visible ? 'bi bi-eye-slash' : 'bi bi-eye';

  return { inputType, iconClass, toggleVisibility };
};