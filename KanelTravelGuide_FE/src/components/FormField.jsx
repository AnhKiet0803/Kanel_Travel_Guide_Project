// One input with a label and an error message. Used by the newer forms (sign in, register, ...).
// as="textarea" gives a multi-line box; the remaining props go straight to <input>/<textarea>.
export default function FormField({ id, label, error, required = false, as: Tag = 'input', ...inputProps }) {
  return (
    <div className="ktg-field">
      <label htmlFor={id}>
        {label}
        {required ? ' *' : ''}
      </label>
      <Tag id={id} aria-invalid={Boolean(error)} {...inputProps} />
      {error && <p className="ktg-error">{error}</p>}
    </div>
  )
}
