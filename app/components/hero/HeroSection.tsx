import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">

      {/* Background Glow */}
      <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
      <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-700/10 blur-[180px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">

        <div className="grid w-full min-w-0 items-center gap-12 lg:grid-cols-2 lg:gap-24">

          {/* LEFT */}
          <div className="min-w-0">

            <p className="mb-6 font-semibold uppercase tracking-[0.2em] text-blue-400 sm:tracking-[6px]">
              Welcome to EquiMaster Pro
            </p>

            <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl lg:text-8xl lg:leading-[0.95]">
              Sport
              <br />
              Horses
              <br />
              Marketplace
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-gray-300 sm:text-xl sm:leading-9">
              Buy, sell and discover elite show jumping horses from trusted
              breeders across Europe.
            </p>

            <div className="mt-12 flex flex-wrap gap-4 sm:gap-5">

              <button className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold shadow-xl transition hover:bg-blue-700 sm:px-8 sm:py-4 sm:text-lg">
                Browse Horses
              </button>

              <button className="rounded-xl border border-white/20 px-6 py-3 text-base transition hover:bg-white hover:text-black sm:px-8 sm:py-4 sm:text-lg">
                Sell Horse
              </button>

            </div>

            <div className="mt-16 flex flex-wrap gap-8 sm:gap-12">

              <div>
                <h3 className="text-3xl font-bold sm:text-4xl">15K+</h3>
                <p className="text-gray-400">Sport Horses</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold sm:text-4xl">1200+</h3>
                <p className="text-gray-400">Breeders</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold sm:text-4xl">28</h3>
                <p className="text-gray-400">Countries</p>
              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="flex min-w-0 justify-center">

            <div className="relative w-full max-w-md lg:max-w-none">

              <div className="absolute inset-0 scale-110 rounded-[35px] bg-blue-600/20 blur-3xl"></div>

              <Image
                src="/emi.jpg"
                alt="Sport Horse"
                width={700}
                height={900}
                priority
                className="relative h-auto w-full max-w-full rounded-[35px] object-cover shadow-2xl"
              />

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}