import { Horse, horses } from "@/app/data/horses";
import HorseCard from "@/app/components/featured/HorseCard";

type Props = {
  currentHorse: Horse;
};

export default function RelatedHorses({ currentHorse }: Props) {
  const related = horses.filter(
    (h) =>
      h.id !== currentHorse.id &&
      h.listingUuid !== currentHorse.listingUuid
  );

  return (
    <section>
      <h2 className="text-3xl font-bold mb-10">
        Related Horses
      </h2>

      <div className="grid md:grid-cols-3 gap-8">
        {related.slice(0, 3).map((horse) => (
          <HorseCard key={horse.id} horse={horse} />
        ))}
      </div>
    </section>
  );
}