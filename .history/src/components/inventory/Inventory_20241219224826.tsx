import { PageContainer } from '../Layout/PageContainer';

export function Inventory() {
  return (
    <PageContainer>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col space-y-6">
          <h1 className="text-2xl font-bold">Inventory</h1>
          {/* Tabs */}
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
              All Items
            </button>
            <button className="px-4 py-2 text-gray-600">
              Consumable
            </button>
            <button className="px-4 py-2 text-gray-600">
              Booster
            </button>
          </div>
          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Item cards */}
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 