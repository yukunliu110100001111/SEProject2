import { Eye, EyeOff } from 'lucide-react';

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
        aria-label={visible ? 'Hide password' : 'Show password'}
        title={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff size={18} strokeWidth={1.8} /> : <Eye size={18} strokeWidth={1.8} />}
      </button>
    </div>
  );
};

export default PasswordField;
