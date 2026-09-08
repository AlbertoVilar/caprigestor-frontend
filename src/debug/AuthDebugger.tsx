/**
 * Deliberately disabled. Authentication diagnostics must never expose JWT
 * claims or credentials in a rendered development overlay.
 */
export default function AuthDebugger() {
  return null;
}
