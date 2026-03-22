import Image from "next/image";

interface RecentResultsProps {
  results: string[];
  onSelectResult: (imageUrl: string) => void;
}

export function RecentResults({ results, onSelectResult }: RecentResultsProps) {
  return (
    <div className="shrink-0">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Results</h3>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`relative flex-1 aspect-[2/3] rounded-lg overflow-hidden ${
              results[i] ? "bg-gray-100" : "bg-gray-200"
            }`}
          >
            {results[i] && (
              <Image
                src={results[i]}
                alt={`Try-on result ${i + 1}`}
                fill
                className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onSelectResult(results[i])}
                unoptimized
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
