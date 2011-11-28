RailsApp::Application.routes.draw do
  resources :tasks

  get "cukes"            => "cukes#index"
  post "cukes/reset_all" => "cukes#reset_all"

  root :to => 'tasks#index'
end
