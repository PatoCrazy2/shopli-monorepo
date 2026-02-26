interface DateFilterTabsProps {
    activeOffset: number;
    onChange: (offset: number) => void;
}

export function DateFilterTabs({ activeOffset, onChange }: DateFilterTabsProps) {
    const tabs = [
        { label: "Hoy", offset: 0 },
        { label: "Ayer", offset: 1 },
        { label: "Hace 2 días", offset: 2 },
        { label: "Hace 3 días", offset: 3 },
    ];

    return (
        <div className="flex w-full gap-2 p-1 bg-gray-200 rounded-xl overflow-x-auto no-scrollbar shrink-0">
            {tabs.map((tab) => {
                const isActive = activeOffset === tab.offset;
                return (
                    <button
                        key={tab.offset}
                        onClick={() => onChange(tab.offset)}
                        className={`
                            flex-1 min-w-[100px] h-12 rounded-lg text-sm font-semibold transition-none
                            ${isActive
                                ? "bg-white text-black shadow-sm"
                                : "text-gray-500 hover:bg-gray-300 hover:text-gray-700"
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
