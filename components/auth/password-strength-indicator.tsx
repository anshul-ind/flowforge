'use client';

/**
 * Password Strength Indicator - PHASE 4
 * 
 * Visual indicator showing password strength (0-4 segments)
 * Evaluates password against multiple criteria:
 * - Length (8+ characters)
 * - Uppercase letters
 * - Lowercase letters
 * - Numbers or symbols
 * 
 * @param password - Password string to evaluate
 */
export function PasswordStrengthIndicator({ password }: { password: string }) {
  // Calculate strength based on criteria
  let strength = 0;
  let label = "Very weak";
  let color = "bg-danger";

  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9!@#$%^&*]/.test(password)) strength++;

  // Determine label and color based on strength
  if (strength === 0) {
    label = "Very weak";
    color = "bg-danger";
  } else if (strength === 1) {
    label = "Weak";
    color = "bg-warning";
  } else if (strength === 2) {
    label = "Fair";
    color = "bg-info";
  } else if (strength === 3) {
    label = "Good";
    color = "bg-info-dark";
  } else {
    label = "Strong";
    color = "bg-success";
  }

  return (
    <div className="space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-2 flex-1 rounded-full transition-all duration-200 ${
              index < strength
                ? color
                : "bg-border"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Strength label */}
      <p className="text-xs font-medium text-secondary">
        Strength: <span className={color === 'bg-danger' ? 'text-danger' : color === 'bg-warning' ? 'text-warning' : color === 'bg-info' ? 'text-info' : 'text-success'}>
          {label}
        </span>
      </p>

      {/* Requirements checklist */}
      <div className="space-y-1">
        <p className="text-xs text-tertiary mb-2">Requirements:</p>
        <div className="space-y-1">
          {/* Length check */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full ${password.length >= 8 ? 'bg-success' : 'bg-border'}`}>
              {password.length >= 8 && (
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={password.length >= 8 ? 'text-primary' : 'text-tertiary'}>
              At least 8 characters
            </span>
          </div>

          {/* Uppercase check */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full ${/[A-Z]/.test(password) ? 'bg-success' : 'bg-border'}`}>
              {/[A-Z]/.test(password) && (
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={/[A-Z]/.test(password) ? 'text-primary' : 'text-tertiary'}>
              One uppercase letter
            </span>
          </div>

          {/* Lowercase check */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full ${/[a-z]/.test(password) ? 'bg-success' : 'bg-border'}`}>
              {/[a-z]/.test(password) && (
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={/[a-z]/.test(password) ? 'text-primary' : 'text-tertiary'}>
              One lowercase letter
            </span>
          </div>

          {/* Number/Symbol check */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full ${/[0-9!@#$%^&*]/.test(password) ? 'bg-success' : 'bg-border'}`}>
              {/[0-9!@#$%^&*]/.test(password) && (
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </span>
            <span className={/[0-9!@#$%^&*]/.test(password) ? 'text-primary' : 'text-tertiary'}>
              One number or symbol
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
