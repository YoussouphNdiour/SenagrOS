# == License
# Ekylibre - Simple agricultural ERP
# Copyright (C) 2008-2011 Brice Texier, Thibaud Merigon
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
#

module Backend
  class SettingsController < Backend::BaseController
    layout 'inertia', only: [:about]

    def about
      db_version = begin
        ActiveRecord::Migrator.current_version.to_s
      rescue
        'N/A'
      end

      lexicon_version = begin
        LexiconVersion.version.to_s
      rescue
        'N/A'
      end

      render inertia: 'Backend/Parametres/About', props: {
        app_info: {
          'ekylibre_version' => Ekylibre.version.to_s,
          'db_version'       => db_version,
          'lexicon_version'  => lexicon_version,
          'tenant'           => ENV['TENANT'].to_s,
          'language'         => Preference[:language].to_s,
          'country'          => Preference[:country].to_s
        }
      }
    end

    list(:datasources,
         conditions: ["(#{DatasourceCredit.table_name}.licence_url = '') IS NOT TRUE"],
         model: :datasource_credits,
         order: :name) do |t|
      t.column :name
      t.column :url, hidden: true
      t.column :provider
      t.column :licence
      t.column :licence_url, hidden: true
      t.column :updated_at
    end
  end
end
