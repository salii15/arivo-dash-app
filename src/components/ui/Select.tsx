import { Fragment, useState } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';

interface Option {
  id: number;
  title: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
}

export default function Select({ value, onChange, options, placeholder = "Select an option" }: SelectProps) {
  const selectedOption = options.find(opt => opt.title === value);

  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <Listbox.Button className="relative w-full items-center select select-bordered bg-base-300 text-left">
          <span className="block text-primary-900 truncate">
            {selectedOption?.title || placeholder}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-5 w-5 text-primary-900" aria-hidden="true" />
          </span>
        </Listbox.Button>
        
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-base-300 py-1 shadow-lg">
            {options.map((option) => (
              <Listbox.Option
                key={option.id}
                value={option.title}
                className={({ active, selected }) =>
                  `relative cursor-pointer select-none py-2 px-4 ${
                    active ? 'bg-primary/20 text-primary-content' : 'text-base-content'
                  } ${selected ? 'bg-primary/30 text-primary-content font-medium' : ''}`
                }
              >
                {({ selected }) => (
                  <span className={`block truncate bg-base-100 p-2 rounded-md  ${selected ? 'bg-primary-900 text-base-700 font-medium' : 'text-base-700 font-normal'}`}>
                    {option.title}
                  </span>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
} 