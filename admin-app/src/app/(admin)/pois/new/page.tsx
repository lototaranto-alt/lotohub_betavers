import { createPoi } from '@/actions/poi'
import Link from 'next/link'

export default function NewPoiPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Aggiungi Nuova Meta (POI)</h1>
        <Link href="/pois" className="text-sm text-gray-500 hover:text-gray-900">
          Torna indietro
        </Link>
      </div>

      <form action={createPoi} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Nome */}
          <div className="sm:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome POI</label>
            <input required type="text" name="name" id="name" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border" />
          </div>

          {/* Categoria */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoria</label>
            <select required name="category" id="category" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border">
              <option value="free">Culturale (Free)</option>
              <option value="partner">Partner (Custode B2B)</option>
              <option value="secret">Mete Segrete (Premium)</option>
            </select>
          </div>

          {/* Layer */}
          <div>
            <label htmlFor="layer_name" className="block text-sm font-medium text-gray-700">Layer Mappa</label>
            <input required type="text" name="layer_name" id="layer_name" defaultValue="poi_layer" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border" />
          </div>

          {/* XP e Quota */}
          <div>
            <label htmlFor="xp_reward" className="block text-sm font-medium text-gray-700">XP Reward</label>
            <input required type="number" name="xp_reward" id="xp_reward" defaultValue="50" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label htmlFor="loto_quota_max" className="block text-sm font-medium text-gray-700">Quota LOTO Max</label>
            <input required type="number" name="loto_quota_max" id="loto_quota_max" defaultValue="100" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border" />
          </div>

          {/* Coordinate */}
          <div>
            <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitudine</label>
            <input required type="number" step="any" name="latitude" id="latitude" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border" />
          </div>
          <div>
            <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitudine</label>
            <input required type="number" step="any" name="longitude" id="longitude" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border" />
          </div>

          {/* Accessibilità */}
          <div className="sm:col-span-2 flex items-center">
            <input type="checkbox" name="is_accessible" id="is_accessible" defaultChecked className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
            <label htmlFor="is_accessible" className="ml-2 block text-sm text-gray-900">
              Accessibile per disabilità motorie (Soft-sorting per percorsi inclusivi)
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button type="submit" className="rounded-md bg-green-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500">
            Salva Meta
          </button>
        </div>
      </form>
    </div>
  )
}
