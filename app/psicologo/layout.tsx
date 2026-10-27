import AceiteProfissional from '@/components/AceiteProfissional'

export default function PsicologoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AceiteProfissional />
    </>
  )
}