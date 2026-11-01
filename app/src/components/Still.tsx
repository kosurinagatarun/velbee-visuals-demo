import { useEffect, useState } from 'react'

type Props = {
  src: string
  alt: string
}

export function Still({ src, alt }: Props) {
  const [current, setCurrent] = useState(src)
  const [incoming, setIncoming] = useState<string | null>(null)

  useEffect(() => {
    if (src === current || src === incoming) return
    setIncoming(src)
  }, [src, current, incoming])

  return (
    <div className="unit-still">
      <img src={current} alt={incoming ? '' : alt} />
      {incoming ? (
        <img
          src={incoming}
          alt={alt}
          className="is-in"
          onLoad={() => {
            setCurrent(incoming)
            setIncoming(null)
          }}
          onError={() => setIncoming(null)}
        />
      ) : null}
    </div>
  )
}
