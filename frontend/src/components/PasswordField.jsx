import { Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../i18n';

const PasswordField = ({
  value,
  onChange,
  placeholder,
  visible,
  onToggle,
  inputRef,
  onFocus,
  onBlur,
}) => {
  const { t } = useI18n();
  const toggleLabel = visible ? t('hidePassword') : t('showPassword');

  return (
    <div className="password-field">
      <input
        ref={inputRef}
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        required
      />
      <button
        type="button"
        className="password-toggle"
        onClick={onToggle}
        aria-label={toggleLabel}
        title={toggleLabel}
      >
        {visible ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
      </button>
    </div>
  );
};

export default PasswordField;
