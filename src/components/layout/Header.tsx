type Props = {
  title: string;
};

export default function Header({ title }: Props) {
  return (
    <header>
      <div>
        <p className="eyebrow">Sistema de cobros</p>
        <h1>{title}</h1>
      </div>

      <div className="date">
        ◷{" "}
        {new Intl.DateTimeFormat("es-BO", {
          dateStyle: "full",
        }).format(new Date())}
      </div>
    </header>
  );
}
