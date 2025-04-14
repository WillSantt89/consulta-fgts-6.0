export const formatarCPF = (cpf: string): string => {
  const cpfNumerico = cpf.replace(/\D/g, '');
  const cpfPreenchido = cpfNumerico.padStart(11, '0');
  return cpfPreenchido;
};

export const formatarTelefone = (telefone?: string): string => {
  if (!telefone) return '-';

  const telefoneLimpo = telefone.replace(/\D/g, '');

  if (telefoneLimpo.length === 11) {
    return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (telefoneLimpo.length === 10) {
    return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return telefone;
};

export const formatarData = (dataString?: string): string => {
  if (!dataString) return '-';

  try {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  } catch (e) {
    return dataString;
  }
};
