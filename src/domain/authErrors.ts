export function authErrorMessage(cause: unknown, action: 'send' | 'verify' | 'session'): string {
  const error = cause && typeof cause === 'object' ? cause as { code?: string; status?: number; name?: string } : {};
  if (error.code === 'over_email_send_rate_limit') {
    return 'Gränsen för inloggningsmejl är nådd. Det kan dröja upp till en timme innan du kan begära en ny kod. Har du redan fått en kod kan du ange den här.';
  }
  if (error.status === 429 || error.code === 'over_request_rate_limit') return 'För många försök. Vänta en stund och försök igen. Har du redan fått en kod behöver du inte begära en ny.';
  if (error.code === 'email_address_not_authorized') return 'Mejltjänsten tillåter inte utskick till den här adressen. Appens mejlinställningar behöver kontrolleras.';
  if (error.code === 'email_provider_disabled') return 'Mejlinloggningen är inte aktiverad. Appens inloggningsinställningar behöver kontrolleras.';
  if (error.code === 'otp_expired' || error.code === 'otp_disabled' || error.code === 'access_denied' && action === 'verify') {
    return 'Koden är felaktig eller har gått ut. Använd den senaste koden i mejlet eller begär en ny.';
  }
  if (error.code === 'flow_state_not_found' || error.code === 'bad_code_verifier' || error.name?.includes('PKCE')) {
    return 'Mejllänken kunde inte användas i den här webbläsaren. Logga in med en engångskod från mejlet i stället.';
  }
  return action === 'send' ? 'Koden kunde inte skickas. Kontrollera internetanslutningen och försök igen om en stund.'
    : action === 'verify' ? 'Inloggningen kunde inte bekräftas. Kontrollera koden och internetanslutningen och försök igen.'
    : 'Inloggningen kunde inte läsas. Logga in med en engångskod igen.';
}
