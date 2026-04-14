import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const Dropdown = ({
  trigger,
  items,
  placement = 'bottom-end',
  className
}) => {
  return (
    <Menu as="div" className={clsx('relative inline-block text-left', className)}>
      <Menu.Button as="div">
        {trigger || (
          <button className="btn btn-secondary">
            Options
            <ChevronDownIcon className="w-4 h-4 ml-2" />
          </button>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className={clsx(
          'absolute z-50 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
          placement === 'bottom-end' && 'right-0',
          placement === 'bottom-start' && 'left-0'
        )}>
          {items.map((section, idx) => (
            <div key={idx} className="px-1 py-1">
              {section.map((item) => (
                <Menu.Item key={item.id}>
                  {({ active }) => (
                    item.href ? (
                      <a
                        href={item.href}
                        className={clsx(
                          'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                          active ? 'bg-blue-50 text-blue-600' : 'text-gray-700',
                          item.danger && 'text-red-600 hover:bg-red-50'
                        )}
                      >
                        {item.icon && <item.icon className="w-4 h-4 mr-3" />}
                        {item.label}
                      </a>
                    ) : (
                      <button
                        onClick={item.onClick}
                        className={clsx(
                          'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                          active ? 'bg-blue-50 text-blue-600' : 'text-gray-700',
                          item.danger && 'text-red-600 hover:bg-red-50'
                        )}
                      >
                        {item.icon && <item.icon className="w-4 h-4 mr-3" />}
                        {item.label}
                      </button>
                    )
                  )}
                </Menu.Item>
              ))}
            </div>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Dropdown;