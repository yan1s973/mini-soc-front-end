export const formatPrice = (value: number) =>
  `${value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} $`

export const formatTime = (time: number) =>
  new Date(time).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

export const formatDateTime = (time: number) =>
  new Date(time).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
