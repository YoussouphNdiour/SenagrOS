# == License
# Ekylibre - Simple agricultural ERP
# Copyright (C) 2008-2013 David Joulin, Brice Texier
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
  class IssuesController < Backend::BaseController
    layout 'inertia', only: %i[show new edit]

    manage_restfully t3e: { name: :name, nature: 'RECORD.nature.text'.c }, observed_at: 'Time.zone.now'.c
    manage_restfully_picture

    respond_to :pdf, :odt, :docx, :xml, :json, :html, :csv

    unroll

    list do |t|
      t.action :edit
      t.action :new, url: { controller: :interventions, issue_id: 'RECORD.id'.c, id: nil }
      t.action :destroy, if: :destroyable?
      t.column :name, url: true
      t.column :nature
      t.column :observed_at
      t.status
      t.column :gravity,  hidden: true
      t.column :priority, hidden: true
    end

    list(:interventions, conditions: { nature: :record, issue_id: 'params[:id]'.c }, order: { started_at: :desc }) do |t|
      t.column :reference_name, label_method: :name, url: true
      t.column :human_target_names, hidden: true
      t.column :started_at
      t.column :stopped_at, hidden: true
      t.column :actions, hidden: true
      t.status
    end

    def close
      return unless @issue = find_and_check

      @issue.close if @issue.can_close?
      redirect_to_back
    end

    def abort
      return unless @issue = find_and_check

      @issue.abort if @issue.can_abort?
      redirect_to_back
    end

    def reopen
      return unless @issue = find_and_check

      @issue.reopen if @issue.can_reopen?
      redirect_to_back
    end

    def show
      return unless @issue = find_and_check(:issue)

      render inertia: 'Backend/Alertes/IssueShow', props: {
        issue: issue_json(@issue)
      }
    end

    def new
      render inertia: 'Backend/Alertes/IssueForm', props: {
        issue: nil,
        errors: {}
      }
    end

    def create
      @issue = Issue.new(
        name:        params.dig(:issue, :name),
        nature:      params.dig(:issue, :nature),
        gravity:     params.dig(:issue, :gravity).to_i,
        observed_at: params.dig(:issue, :observed_at).presence || Time.zone.now,
        description: params.dig(:issue, :description).presence,
        state:       'opened'
      )
      if @issue.save
        redirect_to backend_issue_path(@issue)
      else
        render inertia: 'Backend/Alertes/IssueForm', props: {
          issue: nil,
          errors: @issue.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first }
        }, status: :unprocessable_entity
      end
    end

    def edit
      return unless @issue = find_and_check(:issue)

      render inertia: 'Backend/Alertes/IssueForm', props: {
        issue: issue_json(@issue),
        errors: {}
      }
    end

    def update
      return unless @issue = find_and_check(:issue)

      @issue.name        = params.dig(:issue, :name) if params.dig(:issue, :name).present?
      @issue.nature      = params.dig(:issue, :nature) if params.dig(:issue, :nature).present?
      @issue.gravity     = params.dig(:issue, :gravity).to_i
      @issue.observed_at = params.dig(:issue, :observed_at).presence || @issue.observed_at
      @issue.description = params.dig(:issue, :description).presence
      if @issue.save
        redirect_to backend_issue_path(@issue)
      else
        render inertia: 'Backend/Alertes/IssueForm', props: {
          issue: issue_json(@issue),
          errors: @issue.errors.messages.each_with_object({}) { |(k, v), h| h[k.to_s] = v.first }
        }, status: :unprocessable_entity
      end
    end

    private

    def issue_json(issue)
      {
        id:          issue.id,
        name:        issue.name,
        nature:      issue.nature.to_s,
        gravity:     issue.gravity.to_i,
        observed_at: issue.observed_at&.to_date&.iso8601,
        state:       issue.state.to_s,
        description: issue.description,
        target_type: issue.target_type,
        target_id:   issue.target_id
      }
    end
  end
end
