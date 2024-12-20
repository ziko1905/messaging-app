import { useCallback, useState } from "react";

function useValidator(validator) {
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const changeFormData = useCallback(
    (field, value) => {
      if (validator.isAllowed(field)) {
        setFormData((prevData) => ({ ...prevData, [field]: value }));
      }
    },
    [validator]
  );

  async function validateFormData() {
    setValidationErrors(await validator.validate(formData));
  }

  return {
    formData,
    validationErrors,
    changeFormData,
    validateFormData,
  };
}

export default useValidator;
