export default function VideoPlayer({ src }: { src: string }) {
  return (
    <video controls className="w-full max-w-2xl">
      <source src={src} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}

