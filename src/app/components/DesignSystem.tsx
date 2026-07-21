// FILE DELETED - No longer needed
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Separator } from "./ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { 
  ArrowLeft, 
  Package, 
  Search, 
  Bell, 
  Heart, 
  Star, 
  Mail, 
  User, 
  Settings,
  Home,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  Clock,
  Calendar,
  Map,
  Phone,
  Code,
  Save,
  Palette,
  Type,
  Eye,
  EyeOff,
  RefreshCw,
  Zap
} from "lucide-react";
import BinCard from "./BinCard";
import CabinetComponent from "./CabinetComponent";
import VirtualCabinetComponent from "./VirtualCabinetComponent";
import { ComponentSyncer, generateComponentCode } from "./ComponentSyncer";
import { toast } from "sonner";

interface DesignSystemProps {
  onBack: () => void;
}

interface ComponentConfig {
  name: string;
  file: string;
  properties: {
    [key: string]: {
      type: 'color' | 'size' | 'text' | 'number' | 'boolean' | 'select';
      value: any;
      options?: string[];
      cssVariable?: string;
      description?: string;
    };
  };
}

// Component configurations
const componentConfigs: { [key: string]: ComponentConfig } = {
  button: {
    name: 'Button',
    file: '/components/ui/button.tsx',
    properties: {
      primaryBg: {
        type: 'color',
        value: '#2563eb',
        cssVariable: '--primary',
        description: 'Primary button background'
      },
      primaryForeground: {
        type: 'color',
        value: '#ffffff',
        cssVariable: '--primary-foreground',
        description: 'Primary button text color'
      },
      destructiveBg: {
        type: 'color',
        value: '#d4183d',
        cssVariable: '--destructive',
        description: 'Destructive button background'
      },
      borderRadius: {
        type: 'text',
        value: '0.625rem',
        cssVariable: '--radius',
        description: 'Button border radius'
      },
      defaultHeight: {
        type: 'text',
        value: '2.25rem',
        description: 'Default button height (h-9)'
      },
      smallHeight: {
        type: 'text',
        value: '2rem',
        description: 'Small button height (h-8)'
      },
      largeHeight: {
        type: 'text',
        value: '2.5rem',
        description: 'Large button height (h-10)'
      }
    }
  },
  badge: {
    name: 'Badge',
    file: '/components/ui/badge.tsx',
    properties: {
      defaultBg: {
        type: 'color',
        value: '#2563eb',
        cssVariable: '--primary',
        description: 'Default badge background'
      },
      secondaryBg: {
        type: 'color',
        value: '#ececf0',
        cssVariable: '--muted',
        description: 'Secondary badge background'
      },
      destructiveBg: {
        type: 'color',
        value: '#d4183d',
        cssVariable: '--destructive',
        description: 'Destructive badge background'
      }
    }
  },
  input: {
    name: 'Input',
    file: '/components/ui/input.tsx',
    properties: {
      backgroundColor: {
        type: 'color',
        value: '#f3f3f5',
        cssVariable: '--input-background',
        description: 'Input background color'
      },
      borderColor: {
        type: 'color',
        value: 'rgba(0, 0, 0, 0.1)',
        cssVariable: '--border',
        description: 'Input border color'
      },
      focusRing: {
        type: 'color',
        value: '#708090',
        cssVariable: '--ring',
        description: 'Focus ring color'
      }
    }
  }
};

export default function DesignSystem({ onBack }: DesignSystemProps) {
  const [activeComponent, setActiveComponent] = useState<string>('button');
  const [showCode, setShowCode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: string]: any }>({});
  const [isApplying, setIsApplying] = useState(false);

  // Component state for preview
  const [switchValue, setSwitchValue] = useState(false);
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [sliderValue, setSliderValue] = useState([50]);
  const [radioValue, setRadioValue] = useState("option1");
  const [selectValue, setSelectValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const mockBin = {
    id: "bin-1",
    size: "medium" as const,
    isEmpty: false,
    isAvailable: true,
    position: { x: 0, y: 0 },
    products: [
      {
        id: "prod-1",
        name: "Aspirin 500mg",
        ndcCode: "12345-678-90",
        quantity: 25,
        unit: "tablets",
        expiryDate: "2025-12-31",
        manufacturer: "PharmaCorp"
      }
    ]
  };

  const mockCabinetDoors = ["Door 1", "Door 2", "Door 3", "Door 4"];

  const handlePropertyChange = (componentKey: string, propertyKey: string, value: any) => {
    const changeKey = `${componentKey}.${propertyKey}`;
    setPendingChanges(prev => ({
      ...prev,
      [changeKey]: value
    }));

    // Update CSS variable in real-time for preview
    const property = componentConfigs[componentKey]?.properties[propertyKey];
    if (property?.cssVariable) {
      document.documentElement.style.setProperty(property.cssVariable, value);
    }

    // Queue the update in ComponentSyncer
    const config = componentConfigs[componentKey];
    if (config) {
      ComponentSyncer.addUpdate(
        config.file,
        propertyKey,
        value,
        property?.cssVariable
      );
    }

    toast.info(`Queued change: ${componentKey} ${propertyKey}`);
  };

  const applyChanges = async () => {
    if (ComponentSyncer.getUpdateCount() === 0) {
      toast.info("No changes to apply");
      return;
    }

    setIsApplying(true);
    
    try {
      const success = await ComponentSyncer.applyUpdates();
      
      if (success) {
        toast.success(`Applied ${Object.keys(pendingChanges).length} changes to component files!`);
        setPendingChanges({});
        setEditMode(false);
      } else {
        toast.error("Failed to apply some changes");
      }
    } catch (error) {
      toast.error("Failed to apply changes");
      console.error(error);
    } finally {
      setIsApplying(false);
    }
  };

  const resetChanges = () => {
    // Reset CSS variables to original values
    Object.entries(componentConfigs).forEach(([componentKey, config]) => {
      Object.entries(config.properties).forEach(([propertyKey, property]) => {
        if (property.cssVariable) {
          document.documentElement.style.setProperty(property.cssVariable, property.value);
        }
      });
    });
    
    setPendingChanges({});
    ComponentSyncer.clearUpdates();
    toast.info("Changes reset to original values");
  };

  const showToast = () => {
    toast.success("Product assigned successfully!");
  };

  const generatePreviewCode = () => {
    const updates = ComponentSyncer.getPendingUpdates();
    return generateComponentCode(activeComponent, updates);
  };

  const ComponentEditor = ({ componentKey }: { componentKey: string }) => {
    const config = componentConfigs[componentKey];
    if (!config) return null;

    return (
      <Card className="h-fit">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              {config.name} Properties
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCode(!showCode)}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Code className="w-4 h-4" />}
              </Button>
              <Switch
                checked={editMode}
                onCheckedChange={setEditMode}
              />
              <Label className="text-sm">Edit</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(config.properties).map(([propertyKey, property]) => {
            const currentValue = pendingChanges[`${componentKey}.${propertyKey}`] ?? property.value;
            const isModified = pendingChanges[`${componentKey}.${propertyKey}`] !== undefined;
            
            return (
              <div key={propertyKey} className={`space-y-2 p-3 rounded-lg border ${isModified ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{propertyKey}</Label>
                  {isModified && (
                    <Badge variant="secondary" className="text-xs">
                      Modified
                    </Badge>
                  )}
                </div>
                {property.description && (
                  <p className="text-xs text-gray-500">{property.description}</p>
                )}
                
                {property.type === 'color' && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={currentValue}
                      onChange={(e) => handlePropertyChange(componentKey, propertyKey, e.target.value)}
                      disabled={!editMode}
                      className="w-12 h-8 p-0 border-0 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={currentValue}
                      onChange={(e) => handlePropertyChange(componentKey, propertyKey, e.target.value)}
                      disabled={!editMode}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                )}
                
                {property.type === 'text' && (
                  <Input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handlePropertyChange(componentKey, propertyKey, e.target.value)}
                    disabled={!editMode}
                    className="font-mono text-sm"
                  />
                )}
                
                {property.type === 'number' && (
                  <Input
                    type="number"
                    value={currentValue}
                    onChange={(e) => handlePropertyChange(componentKey, propertyKey, parseFloat(e.target.value))}
                    disabled={!editMode}
                    className="font-mono text-sm"
                  />
                )}
                
                {property.cssVariable && (
                  <p className="text-xs text-blue-600 font-mono">CSS: {property.cssVariable}</p>
                )}
              </div>
            );
          })}
          
          {editMode && Object.keys(pendingChanges).length > 0 && (
            <div className="flex gap-2 pt-4 border-t">
              <Button 
                onClick={applyChanges} 
                size="sm" 
                disabled={isApplying}
                className="flex-1"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1" />
                    Apply Changes ({Object.keys(pendingChanges).length})
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetChanges} size="sm">
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          
          {showCode && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Generated Code Preview</h4>
                <Badge variant="outline" className="text-xs">
                  {config.file}
                </Badge>
              </div>
              <div className="p-3 bg-gray-900 rounded-md text-xs font-mono text-green-400 max-h-40 overflow-y-auto">
                <pre>{generatePreviewCode() || '// No changes queued'}</pre>
              </div>
              <div className="text-xs text-gray-500">
                <Zap className="w-3 h-3 inline mr-1" />
                Changes sync to {config.file} when applied
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Application
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interactive Design System Controller</h1>
              <p className="text-gray-600">Edit components here - changes automatically sync to /components/ui/ files</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {ComponentSyncer.getUpdateCount() > 0 && (
              <Badge variant="secondary" className="animate-pulse">
                {ComponentSyncer.getUpdateCount()} queued changes
              </Badge>
            )}
            <Badge className={editMode ? "bg-green-500" : "bg-gray-500"}>
              {editMode ? (
                <>
                  <Edit className="w-3 h-3 mr-1" />
                  Edit Mode ON
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3 mr-1" />
                  View Mode
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-8">
        {/* Component Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Component Editor
              <Badge variant="outline" className="ml-auto">
                Syncs to /components/ui/
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(componentConfigs).map(([key, config]) => (
                <Button
                  key={key}
                  variant={activeComponent === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveComponent(key)}
                  className="flex items-center gap-2"
                >
                  {config.name}
                  {Object.keys(pendingChanges).some(change => change.startsWith(key)) && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Editor Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Component Preview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Live Preview
                  <Badge variant="outline" className="ml-auto text-xs">
                    Real-time updates
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="buttons" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="buttons">Buttons</TabsTrigger>
                    <TabsTrigger value="inputs">Inputs</TabsTrigger>
                    <TabsTrigger value="display">Display</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  </TabsList>

                  <TabsContent value="buttons" className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg bg-white">
                      <div>
                        <h4 className="font-medium mb-3">Button Variants</h4>
                        <div className="flex flex-wrap gap-3">
                          <Button>Primary Button</Button>
                          <Button variant="secondary">Secondary</Button>
                          <Button variant="outline">Outline</Button>
                          <Button variant="ghost">Ghost</Button>
                          <Button variant="destructive">Destructive</Button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Button Sizes</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button size="sm">Small</Button>
                          <Button>Default</Button>
                          <Button size="lg">Large</Button>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Icon Buttons</h4>
                        <div className="flex flex-wrap gap-3">
                          <Button><Plus className="w-4 h-4 mr-2" />Add Item</Button>
                          <Button variant="outline"><Search className="w-4 h-4 mr-2" />Search</Button>
                          <Button variant="ghost" size="sm"><Settings className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="inputs" className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="Enter your email" />
                          </div>
                          
                          <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" placeholder="Enter password" />
                          </div>

                          <div>
                            <Label htmlFor="message">Message</Label>
                            <Textarea id="message" placeholder="Type your message here..." />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="checkbox" 
                              checked={checkboxValue}
                              onCheckedChange={(checked) => setCheckboxValue(checked as boolean)}
                            />
                            <Label htmlFor="checkbox">Accept terms</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="switch"
                              checked={switchValue}
                              onCheckedChange={setSwitchValue}
                            />
                            <Label htmlFor="switch">Enable notifications</Label>
                          </div>

                          <div>
                            <Label>Volume ({sliderValue[0]}%)</Label>
                            <Slider
                              value={sliderValue}
                              onValueChange={setSliderValue}
                              max={100}
                              step={1}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="display" className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg bg-white">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-3">Badges</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge>Default</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge variant="destructive">Error</Badge>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Progress</h4>
                          <Progress value={67} className="mt-2" />
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Avatar</h4>
                          <div className="flex gap-2">
                            <Avatar>
                              <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <Avatar>
                              <AvatarFallback>AB</AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="feedback" className="space-y-6">
                    <div className="space-y-4 p-4 border rounded-lg bg-white">
                      <Alert>
                        <Bell className="h-4 w-4" />
                        <AlertDescription>
                          This is a default alert with an icon.
                        </AlertDescription>
                      </Alert>

                      <Alert variant="destructive">
                        <X className="h-4 w-4" />
                        <AlertDescription>
                          This is an error alert showing something went wrong.
                        </AlertDescription>
                      </Alert>

                      <div>
                        <h4 className="font-medium mb-3">Toast Notifications</h4>
                        <Button onClick={showToast}>Show Toast</Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Property Editor */}
          <div>
            <ComponentEditor componentKey={activeComponent} />
          </div>
        </div>

        {/* Custom Application Components Preview */}
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Application Components Preview</h2>
          <p className="text-gray-600 mb-6">These components inherit styles from the UI components you edit above.</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bin Component</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <BinCard
                    bin={mockBin}
                    isSelected={false}
                    showHighlight={false}
                    hasSearchMatch={false}
                    isSelectedForAssignment={false}
                    isChangeAllocationSource={false}
                    isChangeAllocationTarget={false}
                    onClick={() => {}}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cabinet Component</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <CabinetComponent
                    cabinetName="Demo Cabinet"
                    doors={mockCabinetDoors}
                    selectedCabinet="Demo Cabinet"
                    selectedDoor="Door 2"
                    doorsWithAvailableBins={["Door 1", "Door 3"]}
                    highlightAvailableBins={false}
                    doorsWithSearchMatches={[]}
                    doorsWithSelectedBins={[]}
                    doorsWithChangeAllocationBins={[]}
                    searchQuery=""
                    showUnallocatedProducts={false}
                    changeAllocationMode={false}
                    onCabinetClick={() => {}}
                    onDoorClick={() => {}}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Virtual Cabinet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <VirtualCabinetComponent
                    cabinetName="Demo Virtual"
                    doors={["Door 13", "Door 14", "Door 15", "Door 16"]}
                    selectedCabinet="Demo Virtual"
                    selectedDoor=""
                    doorsWithAvailableBins={["Door 13", "Door 14"]}
                    highlightAvailableBins={false}
                    doorsWithSearchMatches={[]}
                    doorsWithSelectedBins={[]}
                    doorsWithChangeAllocationBins={[]}
                    searchQuery=""
                    showUnallocatedProducts={false}
                    changeAllocationMode={false}
                    onCabinetClick={() => {}}
                    onDoorClick={() => {}}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}