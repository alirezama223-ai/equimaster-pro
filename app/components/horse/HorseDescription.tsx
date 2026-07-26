import { Horse } from "@/app/data/horses";

type Props = {
  horse: Horse;
};

export default function HorseDescription({ horse }: Props) {
  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold">Description</h2>

      <p className="text-gray-300 leading-8 whitespace-pre-line">
        {horse.description ||
          `${horse.name} is a premium ${horse.breed} sport horse from ${horse.country}. A talented ${horse.discipline.toLowerCase()} horse with excellent rideability and outstanding bloodlines.`}
      </p>
    </section>
  );
}