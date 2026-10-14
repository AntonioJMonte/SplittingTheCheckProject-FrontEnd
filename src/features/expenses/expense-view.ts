/** "Sua parte" é uma busca na resposta da API, não uma conta (spec, Tela 3). */
export function myShareAmount(shares: { memberId: string; amount: string }[], myMemberId: string | undefined): string | null {
  if (myMemberId === undefined) return null
  return shares.find((share) => share.memberId === myMemberId)?.amount ?? null
}
