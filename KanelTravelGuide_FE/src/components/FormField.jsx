// One input with a label, optional hint/password toggle, and an error message.
// as="textarea" gives a multi-line box; the remaining props go straight to <input>/<textarea>.
import { useState } from 'react'

export default function FormField({
  id,
  label,
  error,
  hint,
  required = false,
  as: Tag = 'input',
  type,
  ...inputProps
}) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = Tag === 'input' && type === 'password'

  return (
    <div className="ktg-field">
      <label htmlFor={id}>
        <span>{label}</span>
        {required && (
          <span className="ktg-required" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {isPassword ? (
        <div className="ktg-input-wrap">
          <input
            id={id}
            type={showPassword ? 'text' : 'password'}
            aria-invalid={Boolean(error)}
            {...inputProps}
          />
          <button
            type="button"
            className="ktg-pw-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <Tag id={id} type={type} aria-invalid={Boolean(error)} {...inputProps} />
      )}

      {hint && !error && <p className="ktg-hint">{hint}</p>}
      {error && (
        <p className="ktg-error">
          <i className="bi bi-exclamation-circle" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
