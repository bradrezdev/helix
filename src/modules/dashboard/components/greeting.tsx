interface GreetingProps {
  name: string
}

export function Greeting({ name }: GreetingProps) {
  return (
    <h1 className='text-3xl font-bold text-white absolute top-24 left-5 z-10'>
      ¡Hola!,<br />
      {name}
    </h1>
  )
}
